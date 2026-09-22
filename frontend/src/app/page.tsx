'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DynamicHeroScene from '@/components/three/DynamicHeroScene';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { RestaurantCard } from '@/components/ui/RestaurantCard';
import { LoadingSpinner } from '@/components/ui/Modal';
import { useGetRestaurantsQuery } from '@/store/api/restaurantApi';
import { useAppSelector } from '@/store';
import { Search, Zap, ShieldCheck, MapPin, ArrowRight, Utensils, Star, Flame, LogIn, UserPlus } from 'lucide-react';
import { ROUTES, getRoleHome } from '@/lib/constants';

const CATEGORIES = [
  { name: 'Burger', icon: '🍔', color: 'from-amber-500/20 to-orange-500/20' },
  { name: 'Pizza', icon: '🍕', color: 'from-red-500/20 to-rose-500/20' },
  { name: 'Asian', icon: '🍜', color: 'from-yellow-500/20 to-amber-500/20' },
  { name: 'Sushi', icon: '🍣', color: 'from-teal-500/20 to-emerald-500/20' },
  { name: 'Dessert', icon: '🍩', color: 'from-pink-500/20 to-purple-500/20' },
  { name: 'Healthy', icon: '🥗', color: 'from-green-500/20 to-emerald-500/20' },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  // Role-based redirect for non-customer roles: send them to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== 'CUSTOMER') {
      const target = getRoleHome(user.role);
      if (target && target !== ROUTES.HOME) {
        router.replace(target);
      }
    }
  }, [isAuthenticated, user, router]);

  const isCustomerOrGuest = !user?.role || user?.role === 'CUSTOMER';
  const isNonCustomer = isAuthenticated && user?.role && user.role !== 'CUSTOMER';

  // Gateway allows public GET to /api/v1/restaurants
  const { data: response, isLoading } = useGetRestaurantsQuery(
    { page: 0, size: 6 },
    { skip: isNonCustomer }
  );
  const restaurants = response?.data?.content || [];

  if (isNonCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
      <Header />
      {isAuthenticated && isCustomerOrGuest && <CartDrawer />}

      <div className="flex-1 flex">
        {isAuthenticated && <RoleSidebar role={user?.role} />}

        <main className="flex-1 overflow-x-hidden">
          {/* ── HERO SECTION ───────────────────────────── */}
          <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-8 border-b border-[var(--border-color)]">
            <div className="absolute inset-0 z-0">
              <DynamicHeroScene />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background-color)]/60 to-[var(--background-color)] pointer-events-none z-10" />

            <div className="relative z-20 max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-color)]/80 border border-[var(--primary-color)]/30 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <Zap className="w-4 h-4 text-[var(--primary-color)] animate-pulse" />
                <span className="text-xs font-semibold tracking-wide uppercase text-[var(--text-secondary)]">
                  Microservice-Powered Food Ecosystem
                </span>
              </div>

              <h1
                className="font-outfit text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both"
              >
                {isAuthenticated ? (
                  <>
                    Welcome Back, <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary-color)] via-amber-400 to-orange-500">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    Craving Delivered at <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary-color)] via-amber-400 to-orange-500">
                      Supersonic Speed
                    </span>
                  </>
                )}
              </h1>

              <p
                className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both"
              >
                {isAuthenticated
                  ? `Logged in as ${user?.role}. Explore top restaurants, track active orders, or manage your account.`
                  : 'Sign in to order food, track live GPS deliveries, customize themes, or manage your partner kitchen.'}
              </p>

              {/* Action Buttons / Search Bar */}
              {isAuthenticated ? (
                <div
                  className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 bg-[var(--surface-color)]/90 p-2.5 rounded-2xl border border-[var(--border-color)] shadow-2xl backdrop-blur-xl mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both"
                >
                  <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-[var(--background-color)]/50 rounded-xl border border-[var(--border-color)]/50">
                    <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search restaurant or dish..."
                      className="w-full bg-transparent border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                    />
                  </div>
                  <Link
                    href={`${ROUTES.BROWSE}?search=${encodeURIComponent(searchTerm)}`}
                    className="px-6 py-3 bg-gradient-to-r from-[var(--primary-color)] to-orange-500 hover:brightness-110 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>Browse Menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div
                  className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both"
                >
                  <Link
                    href={ROUTES.LOGIN}
                    className="px-8 py-4 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white font-extrabold text-base rounded-2xl transition-all shadow-xl shadow-[var(--primary-color)]/30 flex items-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In to Start Order</span>
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className="px-8 py-4 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-base rounded-2xl hover:bg-[var(--background-color)] transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5 text-[var(--primary-color)]" />
                    <span>Create Account</span>
                  </Link>
                </div>
              )}

              {/* Metrics */}
              <div
                className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] font-mono animate-in fade-in duration-1000 delay-500 fill-mode-both"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Eureka Service Discovery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Spring Gateway :8080</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>Sub-30min Delivery</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── CUISINE CATEGORIES ─────────────────────── */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider">
                  Taste Exploration
                </span>
                <h2 className="font-outfit text-2xl sm:text-3xl font-bold mt-1">Popular Categories</h2>
              </div>
              <Link
                href={ROUTES.BROWSE}
                className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={`${ROUTES.BROWSE}?cuisine=${cat.name}`}
                >
                  <div
                    className={`bg-gradient-to-br ${cat.color} bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[var(--primary-color)]/50 transition-all cursor-pointer text-center group hover:scale-105 hover:-translate-y-1`}
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-sm font-semibold group-hover:text-[var(--primary-color)]">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── FEATURED RESTAURANTS ────── */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Top Rated
                </span>
                <h2 className="font-outfit text-2xl sm:text-3xl font-bold mt-1">Featured Restaurants</h2>
              </div>
              <Link
                href={ROUTES.BROWSE}
                className="text-xs font-semibold text-[var(--primary-color)] hover:underline flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <LoadingSpinner className="py-12" />
            ) : restaurants.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map((rest) => (
                    <RestaurantCard key={rest.id} restaurant={rest} />
                  ))}
                </div>
                <div className="flex justify-center pt-2">
                  <Link
                    href={ROUTES.BROWSE}
                    className="px-6 py-3 bg-[var(--surface-color)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 group"
                  >
                    <span>Explore All Restaurants</span>
                    <ArrowRight className="w-4 h-4 text-[var(--primary-color)] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-2xl">
                <Utensils className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-secondary)]">No restaurants available right now.</p>
              </div>
            )}
          </section>

          {!isAuthenticated && (
            /* Guest Login CTA Banner */
            <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[var(--border-color)] text-center">
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-8 sm:p-12 rounded-3xl max-w-3xl mx-auto shadow-2xl">
                <ShieldCheck className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-4" />
                <h3 className="font-outfit text-2xl sm:text-3xl font-bold mb-3">
                  Sign In to Access Full Ecosystem
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Log in as a Customer, Restaurant Owner, Delivery Driver, or Administrator to browse menus, manage kitchen orders, and track deliveries.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={ROUTES.BROWSE}
                    className="px-6 py-3 bg-[var(--primary-color)] hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <span>Explore Restaurants</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={ROUTES.LOGIN}
                    className="px-6 py-3 bg-[var(--surface-color)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className="px-6 py-3 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
