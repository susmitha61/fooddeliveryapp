'use client';

import React, { useState } from 'react';
import {
  useGetMyRestaurantsQuery,
  useToggleOpenMutation,
} from '@/store/api/restaurantApi';
import {
  useGetRestaurantOrdersQuery,
  useUpdateOrderStatusMutation,
} from '@/store/api/orderApi';
import { formatCurrency } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';
import {
  Store, Utensils, ClipboardList, TrendingUp,
  ToggleLeft, ToggleRight, Package, Users, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NEXT_STATUS: Record<string, { label: string; value: string; color: string }> = {
  PLACED: { label: 'Confirm Order', value: 'CONFIRMED', color: 'bg-emerald-500 hover:bg-emerald-600' },
  CONFIRMED: { label: 'Start Cooking', value: 'PREPARING', color: 'bg-amber-500 hover:bg-amber-600' },
  PREPARING: { label: 'Mark Ready', value: 'READY_FOR_PICKUP', color: 'bg-violet-500 hover:bg-violet-600' },
};

export default function OwnerDashboardPage() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [orderPage, setOrderPage] = useState(0);

  const { data: myRestaurantsRes, isLoading: restsLoading } = useGetMyRestaurantsQuery();
  const restaurants: any[] = myRestaurantsRes?.data || [];

  React.useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  const { data: ordersRes, isLoading: ordersLoading } = useGetRestaurantOrdersQuery(
    { restaurantId: selectedRestaurantId, page: orderPage, size: 10 },
    { skip: !selectedRestaurantId, pollingInterval: 30000 }
  );

  const [toggleOpen] = useToggleOpenMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const orders: any[] = ordersRes?.data?.content || [];
  const totalOrders = ordersRes?.data?.totalElements || orders.length;
  const totalPages: number = ordersRes?.data?.totalPages || 1;

  const deliveredRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);

  const activeOrders = orders.filter(
    (o) => !['DELIVERED', 'CANCELLED'].includes(o.status)
  );

  const handleToggleOpen = async (id: string) => {
    try {
      await toggleOpen(id).unwrap();
      toast.success('Restaurant open/closed status updated');
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
      toast.success(`Order moved to ${status.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Dashboard"
        subtitle="Manage orders & kitchen operations in real-time."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/owner/restaurants"
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-[var(--primary-color)] transition-all"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" /> My Restaurants
            </Link>
            <Link
              href="/owner/managers"
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-sky-500 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" /> Managers
            </Link>
            <Link
              href="/owner/reviews"
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-amber-400 transition-all"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" /> Customer Reviews
            </Link>
            <Link
              href={ROUTES.OWNER_MENU}
              className="px-3.5 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-[var(--primary-hover)] transition-all"
            >
              <Utensils className="w-3.5 h-3.5" /> Manage Menu
            </Link>
          </div>
        }
      />

      {/* No restaurants */}
      {!restsLoading && restaurants.length === 0 && (
        <EmptyState
          icon={Store}
          title="No Restaurants Yet"
          description="Register your restaurant to start receiving orders."
          action={{
            label: 'Register Restaurant',
            onClick: () => {
              window.location.href = '/owner/restaurants';
            },
          }}
        />
      )}

            {/* Loading */}
            {restsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl animate-pulse h-24" />
                ))}
              </div>
            )}

            {/* Restaurant Selector (multiple restaurants) */}
            {restaurants.length > 1 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRestaurantId(r.id); setOrderPage(0); }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      selectedRestaurantId === r.id
                        ? 'bg-[var(--primary-color)] text-white border-transparent'
                        : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary-color)]'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Restaurant Info Bar */}
            {selectedRestaurant && (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedRestaurant.imageUrl && (
                    <img
                      src={selectedRestaurant.imageUrl}
                      alt={selectedRestaurant.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[var(--border-color)]"
                    />
                  )}
                  <div>
                    <h2 className="font-outfit font-bold text-lg">{selectedRestaurant.name}</h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {selectedRestaurant.cuisineType} •{' '}
                      {selectedRestaurant.area || selectedRestaurant.city || selectedRestaurant.streetAddress}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                        selectedRestaurant.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {selectedRestaurant.status || 'PENDING'}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                        selectedRestaurant.isOpen
                          ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {selectedRestaurant.isOpen ? '● Open Now' : '○ Closed'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleOpen(selectedRestaurant.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:border-[var(--primary-color)] transition-all"
                  >
                    {selectedRestaurant.isOpen
                      ? <><ToggleRight className="w-4 h-4 text-emerald-400" /> Close</>
                      : <><ToggleLeft className="w-4 h-4 text-[var(--text-muted)]" /> Open</>
                    }
                  </button>
                  <Link
                    href={`/owner/restaurants?edit=${selectedRestaurant.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold hover:border-[var(--primary-color)] transition-all"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            {selectedRestaurant && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                  title="Delivered Revenue"
                  value={formatCurrency(deliveredRevenue)}
                  icon={TrendingUp}
                  accentColor="emerald"
                  sublabel="Completed deliveries"
                />
                <StatCard
                  title="Active Orders"
                  value={String(activeOrders.length)}
                  icon={Package}
                  accentColor="amber"
                  sublabel="Kitchen queue"
                />
                <StatCard
                  title="Total Orders (page)"
                  value={String(totalOrders)}
                  icon={ClipboardList}
                  accentColor="orange"
                  sublabel="Recorded order receipts"
                />
              </div>
            )}

            {/* Orders Table */}
            {selectedRestaurant && (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
                  <h3 className="font-outfit font-bold text-base">
                    Incoming Orders
                    <span className="ml-2 text-[var(--text-muted)] font-normal text-sm">({totalOrders})</span>
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] bg-[var(--background-color)] px-3 py-1 rounded-lg border border-[var(--border-color)]">
                    Auto-refreshes every 30s
                  </span>
                </div>

                {ordersLoading ? (
                  <div className="divide-y divide-[var(--border-color)]">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="h-4 bg-[var(--border-color)] rounded w-1/3 mb-2" />
                        <div className="h-3 bg-[var(--border-color)] rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <ClipboardList className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-secondary)]">No orders yet. They'll appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {orders.map((order) => (
                      <div key={order.orderId || order.id} className="p-4 sm:p-5 hover:bg-[var(--background-color)] transition-colors">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-[var(--primary-color)]">
                                #{(order.orderId || order.id || '').slice(-8).toUpperCase()}
                              </span>
                              <StatusBadge status={order.status} type="order" />
                              <span className="text-[11px] text-[var(--text-muted)]">
                                {order.paymentMethod?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              📍 {[order.deliveryAddress, order.deliveryArea, order.deliveryCity].filter(Boolean).join(', ')}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {order.items?.length || 0} item(s) •{' '}
                              <span className="font-bold text-[var(--text-primary)]">{formatCurrency(order.totalAmount || 0)}</span>
                            </p>
                            {order.specialInstructions && (
                              <p className="text-[11px] text-amber-400 mt-1 italic">
                                📝 {order.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {NEXT_STATUS[order.status] && (
                              <button
                                onClick={() => handleUpdateStatus(order.orderId || order.id, NEXT_STATUS[order.status].value)}
                                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors ${NEXT_STATUS[order.status].color}`}
                              >
                                {NEXT_STATUS[order.status].label}
                              </button>
                            )}
                            {order.status === 'READY_FOR_PICKUP' && (
                              <span className="text-[11px] text-violet-400 font-semibold px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                                Awaiting Driver
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 p-4 border-t border-[var(--border-color)]">
                    <button disabled={orderPage === 0} onClick={() => setOrderPage(p => p - 1)}
                      className="px-4 py-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold disabled:opacity-40">
                      ← Prev
                    </button>
                    <span className="px-4 py-2 text-xs font-mono font-bold flex items-center">
                      {orderPage + 1} / {totalPages}
                    </span>
                    <button disabled={orderPage >= totalPages - 1} onClick={() => setOrderPage(p => p + 1)}
                      className="px-4 py-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold disabled:opacity-40">
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
    </div>
  );
}
