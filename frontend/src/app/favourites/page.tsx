'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGetFavouritesQuery, useRemoveFavouriteMutation } from '@/store/api/userApi';
import { useAppSelector } from '@/store';
import Link from 'next/link';
import { Heart, Store, Trash2, Utensils } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function FavouritesPage() {
  const { user } = useAppSelector(s => s.auth);
  const userId = user?.id || '';
  const role = user?.role || 'CUSTOMER';

  const { data: favsRes, isLoading } = useGetFavouritesQuery(userId, { skip: !userId });
  const [removeFavourite] = useRemoveFavouriteMutation();
  const favs: any[] = favsRes?.data || [];

  const handleRemove = async (restaurantId: string, restaurantName: string) => {
    try {
      await removeFavourite({ userId, restaurantId }).unwrap();
      toast.success(`Removed ${restaurantName} from favourites`);
    } catch {
      toast.error('Failed to remove favourite');
    }
  };

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex">
          <RoleSidebar role={role} />
          <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
            <PageHeader
              title="My Favourites"
              subtitle="Your saved restaurants for quick access."
            />
            <div className="h-6" />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : favs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {favs.map((fav) => (
                  <div key={fav.id || fav.restaurantId}
                    className="group bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:border-[var(--primary-color)]/40 hover:shadow-lg hover:shadow-[var(--primary-color)]/5 transition-all">
                    <Link href={ROUTES.RESTAURANT(fav.restaurantId)} className="block">
                      {fav.restaurantImageUrl ? (
                        <img src={fav.restaurantImageUrl} alt={fav.restaurantName}
                          className="w-full h-36 object-cover"
                          onError={e => { e.currentTarget.parentElement!.querySelector('.img-fallback')!.classList.remove('hidden'); e.currentTarget.style.display = 'none'; }} />
                      ) : null}
                      <div className={`img-fallback h-36 bg-[var(--background-color)] flex items-center justify-center ${fav.restaurantImageUrl ? 'hidden' : ''}`}>
                        <Store className="w-10 h-10 text-[var(--text-muted)]" />
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={ROUTES.RESTAURANT(fav.restaurantId)}>
                            <h3 className="font-outfit font-bold text-base hover:text-[var(--primary-color)] transition-colors line-clamp-1">
                              {fav.restaurantName}
                            </h3>
                          </Link>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            <Utensils className="w-3 h-3" />
                            <span>{fav.cuisineType || 'Restaurant'}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(fav.restaurantId, fav.restaurantName)}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <Link href={ROUTES.RESTAURANT(fav.restaurantId)}
                        className="mt-3 block w-full text-center px-3 py-2 bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-xs font-semibold rounded-xl hover:bg-[var(--primary-color)]/20 transition-colors">
                        Order Again →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No Favourites Yet"
                description="Click the heart ❤️ on any restaurant to save it here for quick access."
                action={{
                  label: 'Browse Restaurants',
                  onClick: () => {
                    window.location.href = ROUTES.BROWSE;
                  },
                }}
              />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
