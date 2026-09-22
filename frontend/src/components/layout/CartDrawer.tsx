'use client';

import React, { useEffect, useCallback } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeCart, removeItem, updateItemQty, clearCart } from '@/store/slices/cartSlice';
import { useRemoveCartItemMutation, useUpdateCartItemMutation, useClearCartMutation } from '@/store/api/orderApi';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const { isOpen, items, totalAmount, totalItems, restaurantName } = useAppSelector((s) => s.cart);
  const [removeItemApi] = useRemoveCartItemMutation();
  const [updateItemApi] = useUpdateCartItemMutation();
  const [clearCartApi] = useClearCartMutation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeCart());
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleRemove = async (id: string) => {
    dispatch(removeItem(id));
    try {
      await removeItemApi(id).unwrap();
    } catch {
      // Ignore API errors if local cart is modified
    }
  };

  const handleQtyChange = async (id: string, qty: number) => {
    if (qty < 1) {
      handleRemove(id);
      return;
    }
    dispatch(updateItemQty({ id, quantity: qty }));
    try {
      await updateItemApi({ cartItemId: id, quantity: qty }).unwrap();
    } catch {}
  };

  const handleClear = async () => {
    dispatch(clearCart());
    dispatch(closeCart());
    try {
      await clearCartApi().unwrap();
    } catch {}
  };

  return (
    <>
      {isOpen && (
        <>
          <div
            onClick={() => dispatch(closeCart())}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
            className="fixed top-0 right-0 z-50 w-full sm:w-[420px] h-full bg-[var(--surface-color)] border-l border-[var(--border-color)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Your Cart</h2>
                {restaurantName && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    From {restaurantName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors font-semibold"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => dispatch(closeCart())}
                  aria-label="Close cart"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                  <ShoppingBag className="w-12 h-12 text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Your cart is empty</p>
                  <button
                    onClick={() => dispatch(closeCart())}
                    className="px-6 py-2.5 rounded-xl bg-[var(--primary-color)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all shadow-md"
                  >
                    Browse Restaurants
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id || item.menuItemId}
                    className="flex gap-3 p-3 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)]"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900">
                      <Image
                        src={item.imageUrl || DEFAULT_FOOD_IMAGE}
                        alt={item.name || item.menuItemName || 'Item'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {item.name || item.menuItemName}
                      </p>
                      <p className="text-xs font-bold text-[var(--primary-color)] mt-0.5">
                        {formatCurrency(item.subtotal || item.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleQtyChange(item.id || item.menuItemId, item.quantity - 1)}
                          className="p-1 rounded bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[var(--text-primary)] w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQtyChange(item.id || item.menuItemId, item.quantity + 1)}
                          className="p-1 rounded bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemove(item.id || item.menuItemId)}
                          className="ml-auto text-rose-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-[var(--border-color)] space-y-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[var(--text-secondary)]">{totalItems} items</span>
                  <span className="font-bold text-lg text-[var(--text-primary)]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <Link href="/checkout" onClick={() => dispatch(closeCart())}>
                  <button className="w-full py-3.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                    Proceed to Checkout →
                  </button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
