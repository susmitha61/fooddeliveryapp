'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Flame, Leaf } from 'lucide-react';
import { MenuItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DishRatingBadge } from './DishRatingBadge';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem, updateItemQty, removeItem, setPendingItem } from '@/store/slices/cartSlice';
import { useAddToCartMutation, useUpdateCartItemMutation, useRemoveFromCartMutation } from '@/store/api/orderApi';
import toast from 'react-hot-toast';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}

export function MenuItemCard({ item, restaurantId, restaurantName }: MenuItemCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.items);

  const [addToCartApi] = useAddToCartMutation();
  const [updateCartItemApi] = useUpdateCartItemMutation();
  const [removeFromCartApi] = useRemoveFromCartMutation();

  const existingCartItem = cartItems.find((i) => i.menuItemId === item.id || i.id === item.id);
  const qty = existingCartItem?.quantity || 0;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      dispatch(
        setPendingItem({
          restaurantId,
          restaurantName,
          item: {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl,
          },
        })
      );
      toast('Sign in to add items to your cart', { icon: '🔒' });
      router.push(`/auth/login?redirect=/restaurants/${restaurantId}`);
      return;
    }

    dispatch(
      addItem({
        restaurantId,
        restaurantName,
        item: {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
        },
      })
    );
    toast.success(`Added ${item.name} to cart`);

    try {
      await addToCartApi({
        restaurantId,
        restaurantName,
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        quantity: 1,
        isVegetarian: item.vegetarian || item.isVeg,
        imageUrl: item.imageUrl,
      }).unwrap();
    } catch (err) {
      console.warn('Backend cart add warning:', err);
    }
  };

  const handleIncrement = async () => {
    const newQty = qty + 1;
    dispatch(updateItemQty({ menuItemId: item.id, quantity: newQty }));

    if (isAuthenticated) {
      try {
        const cartItemId = existingCartItem?.id || item.id;
        await updateCartItemApi({ cartItemId, quantity: newQty }).unwrap();
      } catch (err) {
        console.warn('Backend cart update warning:', err);
      }
    }
  };

  const handleDecrement = async () => {
    const newQty = qty - 1;
    if (newQty <= 0) {
      dispatch(removeItem(item.id));
      if (isAuthenticated && existingCartItem?.id) {
        try {
          await removeFromCartApi(existingCartItem.id).unwrap();
        } catch (err) {
          console.warn('Backend cart remove warning:', err);
        }
      }
    } else {
      dispatch(updateItemQty({ menuItemId: item.id, quantity: newQty }));
      if (isAuthenticated) {
        try {
          const cartItemId = existingCartItem?.id || item.id;
          await updateCartItemApi({ cartItemId, quantity: newQty }).unwrap();
        } catch (err) {
          console.warn('Backend cart update warning:', err);
        }
      }
    }
  };

  const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-4 flex gap-4 transition-all hover:border-[var(--primary-color)]/30 group">
      {/* Item Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
        <Image
          src={item.imageUrl || defaultImg}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="112px"
        />
        {item.spicy && (
          <span className="absolute top-1 left-1 bg-rose-500/80 text-white p-1 rounded-md text-[10px] backdrop-blur-xs flex items-center gap-0.5">
            <Flame className="w-3 h-3 fill-current" />
          </span>
        )}
        {item.vegetarian && (
          <span className="absolute top-1 right-1 bg-emerald-500/80 text-white p-1 rounded-md text-[10px] backdrop-blur-xs flex items-center gap-0.5">
            <Leaf className="w-3 h-3 fill-current" />
          </span>
        )}
      </div>

      {/* Info & Add */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <div>
              <h4 className="font-outfit font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary-color)] transition-colors">
                {item.name}
              </h4>
              <div className="mt-0.5">
                <DishRatingBadge
                  menuItemId={item.id}
                  initialRating={item.rating}
                  initialCount={item.totalRatings}
                  size="xs"
                />
              </div>
            </div>
            <span className="font-bold text-[var(--primary-color)] text-sm shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">
            {item.description || 'Delicious freshly prepared dish.'}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {item.available !== false ? 'Available' : 'Sold Out'}
          </span>

          {item.available !== false && (
            <div>
              {qty === 0 ? (
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary-color)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] active:scale-95 flex items-center gap-1 shadow-md shadow-[var(--primary-color)]/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-lg p-1">
                  <button
                    onClick={handleDecrement}
                    className="p-1 rounded hover:bg-neutral-800 text-[var(--text-primary)] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-[var(--primary-color)] px-1">{qty}</span>
                  <button
                    onClick={handleIncrement}
                    className="p-1 rounded hover:bg-neutral-800 text-[var(--text-primary)] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
