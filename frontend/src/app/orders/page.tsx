'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { LoadingSpinner } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem, clearCart } from '@/store/slices/cartSlice';
import { useGetMyOrdersQuery, useCancelOrderMutation } from '@/store/api/orderApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  Clock, ArrowRight, MapPin, ShoppingBag, XCircle,
  CheckCircle2, ChevronRight, Store, Star, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyOrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const { data: response, isLoading, refetch } = useGetMyOrdersQuery({ page: 0, size: 20 }, {
    pollingInterval: 3000,
  });

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const rawArray = extractArray(response);

  // Group unique orders by orderId / id so an order ID appears ONLY ONCE
  const uniqueOrdersMap = new Map<string, any>();
  rawArray.forEach((ord: any) => {
    const id = ord?.orderId || ord?.id;
    if (id && !uniqueOrdersMap.has(id)) {
      uniqueOrdersMap.set(id, ord);
    }
  });
  const orders = Array.from(uniqueOrdersMap.values());

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingOrderId(orderId);
    try {
      await cancelOrder({ orderId, reason: 'Cancelled by customer' }).unwrap();
      toast.success('Order cancelled successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleRepeatOrder = (order: any) => {
    const items = order.items || [];
    if (!items.length) {
      toast.error('No items to reorder');
      return;
    }
    dispatch(clearCart());
    items.forEach((item: any) => {
      dispatch(addItem({
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName || 'Restaurant',
        item: {
          menuItemId: item.menuItemId || item.itemId || item.id,
          name: item.itemName || item.name || 'Menu Item',
          price: Number(item.price || item.unitPrice || 0),
          quantity: Number(item.quantity || 1),
          imageUrl: item.imageUrl,
        },
      }));
    });
    toast.success('Order items added to cart! Redirecting to checkout...');
    router.push('/checkout');
  };

  const filteredOrders = orders.filter((o: any) => {
    const st = o?.status || 'PLACED';
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(st);
    if (statusFilter === 'OUT_FOR_DELIVERY') return st === 'OUT_FOR_DELIVERY';
    if (statusFilter === 'DELIVERED') return st === 'DELIVERED';
    if (statusFilter === 'CANCELLED') return st === 'CANCELLED';
    return true;
  });

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={user?.role} />

          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
            <PageHeader
              title="My Orders"
              subtitle="Track active orders in real-time or review past food purchases."
            />

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'ALL', label: 'All Orders', count: orders.length },
                { key: 'ACTIVE', label: 'Active', count: orders.filter((o: any) => ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o?.status)).length },
                { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: orders.filter((o: any) => o?.status === 'OUT_FOR_DELIVERY').length },
                { key: 'DELIVERED', label: 'Delivered', count: orders.filter((o: any) => o?.status === 'DELIVERED').length },
                { key: 'CANCELLED', label: 'Cancelled', count: orders.filter((o: any) => o?.status === 'CANCELLED').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    statusFilter === tab.key
                      ? 'bg-[var(--primary-color)] text-white shadow-sm'
                      : 'bg-[var(--surface-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${statusFilter === tab.key ? 'bg-black/20 text-white' : 'bg-[var(--background-color)] text-[var(--text-muted)]'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order: any, idx: number) => {
                  const id = order?.orderId || order?.id || `ORD-${idx}`;
                  const shortId = String(id).slice(-8);
                  const status = order?.status || 'PLACED';
                  const items: any[] = order?.items || [];
                  const isCancellable = ['PLACED', 'PENDING', 'CONFIRMED'].includes(status);
                  const isDelivered = status === 'DELIVERED';

                  return (
                    <div
                      key={id}
                      className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 sm:p-6 rounded-2xl space-y-4 shadow-sm hover:border-[var(--primary-color)]/40 transition-all group"
                    >
                      {/* Top Bar: Order ID + Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                            #{shortId}
                          </span>
                          <StatusBadge status={status} type="order" />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                          <span>{formatDate(order.createdAt || new Date().toISOString())}</span>
                        </div>
                      </div>

                      {/* Restaurant & Address */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                            <Store className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
                            <span>{order.restaurantName || 'Restaurant Partner'}</span>
                          </h3>

                          {order.deliveryAddress && (
                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-[var(--primary-color)] shrink-0" />
                              <span className="line-clamp-1">
                                {[order.deliveryAddress, order.deliveryArea, order.deliveryCity].filter(Boolean).join(', ')}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Total Amount */}
                        <div className="sm:text-right">
                          <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Total Paid</span>
                          <span className="font-outfit font-extrabold text-xl text-[var(--primary-color)]">
                            {formatCurrency(order.totalAmount || order.subtotal || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Item Preview */}
                      {items.length > 0 && (
                        <div className="bg-[var(--background-color)] border border-[var(--border-color)]/60 rounded-xl p-3 text-xs space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] block mb-1">
                            Items Ordered ({items.length})
                          </span>
                          {items.map((it: any, i: number) => (
                            <div key={it.orderItemId || it.itemId || i} className="flex justify-between items-center text-[var(--text-secondary)]">
                              <span>
                                {it.itemName || it.name} <span className="font-bold text-[var(--text-primary)]">×{it.quantity}</span>
                              </span>
                              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                                {formatCurrency(it.itemTotal || (it.price * it.quantity) || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]/50">
                        {isCancellable ? (
                          <button
                            onClick={() => handleCancelOrder(id)}
                            disabled={isCancelling && cancellingOrderId === id}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isCancelling && cancellingOrderId === id ? 'Cancelling...' : 'Cancel Order'}</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Payment Status: <strong className="text-[var(--text-primary)]">{order.paymentStatus || 'PAID'}</strong></span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {isDelivered && (
                            <button
                              onClick={() => handleRepeatOrder(order)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                              title="Order again with same items"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Repeat Order</span>
                            </button>
                          )}

                          {isDelivered && order.restaurantId && (
                            <Link
                              href={`${ROUTES.RESTAURANT(order.restaurantId)}?tab=reviews`}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>Rate & Review</span>
                            </Link>
                          )}

                          <Link
                            href={ROUTES.TRACKING(id)}
                            className="px-4 py-2 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-md shadow-[var(--primary-color)]/20"
                          >
                            <span>Track & Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title={orders.length === 0 ? "No Orders Placed Yet" : "No Orders In This Category"}
                description={
                  orders.length === 0
                    ? "Browse top local restaurants and order your favorite dishes fresh to your door!"
                    : "No orders match the selected filter tab. Try viewing All Orders."
                }
                action={orders.length === 0 ? {
                  label: 'Browse Restaurants',
                  onClick: () => {
                    window.location.href = ROUTES.BROWSE;
                  },
                } : {
                  label: 'View All Orders',
                  onClick: () => setStatusFilter('ALL'),
                }}
              />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
