'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RoleSidebar, GuestSidebar } from '@/components/layout/CustomerSidebar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { RestaurantCard } from '@/components/ui/RestaurantCard';
import { LoadingSpinner } from '@/components/ui/Modal';
import { useFilterRestaurantsQuery } from '@/store/api/restaurantApi';
import { useAppSelector } from '@/store';
import { Search, Utensils, Star, Clock, SlidersHorizontal, RotateCcw } from 'lucide-react';

const CUISINES = ['All', 'Burger', 'Pizza', 'Asian', 'Sushi', 'Dessert', 'Healthy', 'Indian', 'Italian'];

function BrowseContent() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCuisine = searchParams.get('cuisine') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');
  const [page, setPage] = useState(0);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Server-side filter params
  const filterParams: Record<string, any> = {
    page,
    size: 20,
  };
  if (debouncedSearch.trim()) filterParams.keyword = debouncedSearch.trim();
  if (selectedCuisine && selectedCuisine !== 'All') filterParams.cuisineType = selectedCuisine;
  if (openNowOnly) filterParams.isOpen = true;
  if (minRating > 0) filterParams.minRating = minRating;
  if (sortBy && sortBy !== 'DEFAULT') filterParams.sortBy = sortBy;

  const { data: response, isLoading } = useFilterRestaurantsQuery(filterParams);

  const restaurants = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 1;

  // Max delivery time filter (fallback client-side if set)
  const displayedRestaurants = maxDeliveryTime === 'ALL'
    ? restaurants
    : restaurants.filter((r: any) => (r.deliveryTimeMinutes || r.estimatedDeliveryTime || 30) <= Number(maxDeliveryTime));

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCuisine !== 'All' ||
    openNowOnly ||
    minRating > 0 ||
    maxDeliveryTime !== 'ALL' ||
    sortBy !== 'DEFAULT';

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCuisine('All');
    setOpenNowOnly(false);
    setMinRating(0);
    setMaxDeliveryTime('ALL');
    setSortBy('DEFAULT');
    setPage(0);
  };

  const isCustomer = !user?.role || user?.role === 'CUSTOMER';

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
      <Header />
      {isCustomer && <CartDrawer />}

      <div className="flex-1 flex">
        {isAuthenticated ? <RoleSidebar role={user?.role} /> : <GuestSidebar />}

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-6 space-y-4">
            <PageHeader
              title="Explore Restaurants"
              description="Discover top kitchens and get fresh food delivered to your door."
            />

            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl shadow-xs">
                <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search restaurants by name or cuisine..."
                  className="w-full bg-transparent border-none text-sm focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value="DEFAULT">Sort: Featured</option>
                  <option value="RATING">Sort: Highest Rated</option>
                  <option value="DELIVERY_TIME">Sort: Fastest Delivery</option>
                  <option value="NAME">Sort: Name (A-Z)</option>
                </select>

                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="px-3 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value={0}>Rating: Any</option>
                  <option value={4.0}>Rating: 4.0+ ★</option>
                  <option value={4.5}>Rating: 4.5+ ★</option>
                </select>

                <select
                  value={maxDeliveryTime}
                  onChange={(e) => setMaxDeliveryTime(e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value="ALL">Time: Any</option>
                  <option value="30">Under 30 mins</option>
                  <option value="45">Under 45 mins</option>
                  <option value="60">Under 60 mins</option>
                </select>

                <button
                  type="button"
                  onClick={() => setOpenNowOnly((v) => !v)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    openNowOnly
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                      : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                  }`}
                >
                  {openNowOnly ? '● Open Now' : '○ Open Now'}
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="p-2.5 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white transition-colors"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cuisines Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CUISINES.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => {
                    setSelectedCuisine(cuisine);
                    setPage(0);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCuisine === cuisine
                      ? 'bg-[var(--primary-color)] text-white shadow-md'
                      : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner className="py-20" />
          ) : displayedRestaurants.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {displayedRestaurants.map((rest: any) => (
                  <RestaurantCard key={rest.id} restaurant={rest} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-xs font-mono font-bold flex items-center">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Utensils}
              title="No Restaurants Found"
              description="No restaurants match your active filters. Try broadening your delivery time, cuisine, or search keywords."
              action={{
                label: 'Reset Filters',
                onClick: resetFilters,
              }}
            />
          )}
        </main>
      </div>
    </div>
    );
  }

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center">
          <LoadingSpinner className="py-20" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
