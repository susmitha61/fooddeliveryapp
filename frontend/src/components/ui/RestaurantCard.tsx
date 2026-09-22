'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Restaurant } from '@/types';
import { ROUTES } from '@/lib/constants';
import { useAddFavouriteMutation, useRemoveFavouriteMutation } from '@/store/api/userApi';
import { useGetRestaurantReviewSummaryQuery } from '@/store/api/supportApi';
import { useAppSelector } from '@/store';
import { RestaurantRatingBadge } from '@/components/ui/RestaurantRatingBadge';
import toast from 'react-hot-toast';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
}

export function RestaurantCard({ restaurant, isFavorite = false }: RestaurantCardProps) {
  const { user: currentUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const [addFav] = useAddFavouriteMutation();
  const [removeFav] = useRemoveFavouriteMutation();
  const [fav, setFav] = React.useState(isFavorite);

  const { data: summaryRes } = useGetRestaurantReviewSummaryQuery(restaurant.id, {
    skip: !restaurant.id,
  });
  const summary = summaryRes?.data;
  const liveRating = Number(summary?.averageRating ?? 0);
  const liveCount = Number(summary?.totalReviews ?? (restaurant as any).totalRatings ?? 0);

  const displayRating = liveRating > 0
    ? liveRating.toFixed(1)
    : (restaurant.rating && restaurant.rating > 0)
    ? restaurant.rating.toFixed(1)
    : '4.8';

  const handleFavClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save favorites');
      return;
    }

    try {
      if (fav) {
        await removeFav({ userId: currentUser?.id || '', restaurantId: restaurant.id }).unwrap();
        setFav(false);
        toast.success('Removed from favorites');
      } else {
        await addFav({
          userId: currentUser?.id || '',
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantCuisine: restaurant.cuisineType,
        }).unwrap();
        setFav(true);
        toast.success('Added to favorites!');
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const defaultBanner = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-lg hover:shadow-[var(--accent-glow)] flex flex-col h-full"
    >
      <Link href={ROUTES.RESTAURANT(restaurant.id)} className="flex flex-col h-full">
        <div className="relative h-44 w-full bg-neutral-900 overflow-hidden">
          <Image
            src={restaurant.imageUrl || defaultBanner}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md ${
                (restaurant.isOpen !== false && (restaurant as any).isActive !== false && restaurant.active !== false)
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {(restaurant.isOpen !== false && (restaurant as any).isActive !== false && restaurant.active !== false) ? 'Open Now' : 'Closed'}
            </span>
          </div>

          <button
            onClick={handleFavClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-rose-500 hover:bg-black/60 transition-all"
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-outfit text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary-color)] transition-colors line-clamp-1">
                {restaurant.name}
              </h3>
              <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-bold shrink-0">
                <RestaurantRatingBadge
                  restaurantId={restaurant.id}
                  initialRating={restaurant.rating}
                  initialCount={(restaurant as any).totalRatings}
                  showCount
                />
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mb-3">
              {restaurant.cuisineType || restaurant.description || 'Multi-Cuisine'}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-3 mt-auto">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[var(--primary-color)]" />
              <span>{(restaurant as any).avgDeliveryMinutes || restaurant.deliveryTimeMinutes || restaurant.estimatedDeliveryTime || '25-35'} min</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--primary-color)]" />
              <span className="line-clamp-1 max-w-[120px]">
                {(restaurant as any).area || (restaurant as any).city || restaurant.address || restaurant.addressLine1 || 'City'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
