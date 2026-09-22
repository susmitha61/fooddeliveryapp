'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store';
import { useGetMyRestaurantsQuery, useToggleOpenMutation } from '@/store/api/restaurantApi';
import { LoadingSpinner } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { RestaurantRatingBadge } from '@/components/ui/RestaurantRatingBadge';
import { Store, Star, MapPin, Power } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerRestaurantsPage() {
  const { user } = useAppSelector(s => s.auth);
  const isManager = user?.role === 'MANAGER';

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const { data: myRestaurantsRes, isLoading, refetch } = useGetMyRestaurantsQuery();
  const [toggleOpen] = useToggleOpenMutation();

  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  const handleToggleOpen = async (id: string) => {
    try {
      await toggleOpen(id).unwrap();
      toast.success('Restaurant open status toggled!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle status');
    }
  };

  if (isManager && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
      </div>
    );
  }

  if (isManager && !hasAssociatedRestaurant) {
    return <ManagerUnassignedScreen onRefresh={refetch} pageTitle="Store Operations" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Stores Operations"
        description="Live store operational statuses and open/closed toggles for your assigned restaurants."
      />

                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : myRestaurants.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]">
                    <Store className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <h3 className="font-outfit font-bold text-lg">No Stores Assigned</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myRestaurants.map((rest: any) => (
                      <div
                        key={rest.id}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-[var(--primary-color)]/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] mb-1 inline-block">
                              {rest.cuisineType || 'Multi-Cuisine'}
                            </span>
                            <h3 className="font-outfit font-bold text-lg">{rest.name}</h3>
                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                              <span>{[rest.area, rest.city].filter(Boolean).join(', ')}</span>
                            </p>
                          </div>

                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            rest.isOpen !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {rest.isOpen !== false ? '● OPEN NOW' : '○ CLOSED'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-color)]/60">
                          <RestaurantRatingBadge
                            restaurantId={rest.id}
                            initialRating={rest.rating}
                            initialCount={rest.totalRatings}
                            showCount
                          />

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleOpen(rest.id)}
                              className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                            >
                              <Power className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                              <span>Toggle Open</span>
                            </button>
                            <Link
                              href={`/manager/menu`}
                              className="px-3 py-1.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all"
                            >
                              Manage Menu
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
    </div>
  );
}
