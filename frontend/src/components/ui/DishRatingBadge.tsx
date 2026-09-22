'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { useGetMenuItemReviewSummaryQuery, useGetMenuItemReviewsQuery } from '@/store/api/supportApi';

interface DishRatingBadgeProps {
  menuItemId?: string;
  initialRating?: number;
  initialCount?: number;
  showCount?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function DishRatingBadge({
  menuItemId,
  initialRating = 0,
  initialCount = 0,
  showCount = true,
  size = 'sm',
  className = '',
}: DishRatingBadgeProps) {
  const { data: summaryRes } = useGetMenuItemReviewSummaryQuery(menuItemId || '', {
    skip: !menuItemId,
    pollingInterval: 5000,
  });

  const { data: reviewsRes } = useGetMenuItemReviewsQuery(menuItemId || '', {
    skip: !menuItemId,
    pollingInterval: 5000,
  });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    return [];
  };

  const summary = summaryRes?.data;
  const reviews = extractArray(reviewsRes);

  const liveCount = Number(summary?.totalReviews ?? (reviews.length > 0 ? reviews.length : (initialCount || 0)));

  let liveRating = Number(summary?.averageRating ?? 0);
  if (liveRating <= 0 && reviews.length > 0) {
    const validReviews = reviews.filter((r: any) => Number(r.rating) > 0);
    if (validReviews.length > 0) {
      const sum = validReviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0);
      liveRating = sum / validReviews.length;
    }
  }
  if (liveRating <= 0 && initialRating && initialRating > 0) {
    liveRating = initialRating;
  }

  const hasRatings = liveCount > 0 && liveRating > 0;
  const displayRating = hasRatings ? liveRating.toFixed(1) : '0';

  const starSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-xs font-bold',
    lg: 'text-sm font-extrabold',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 font-semibold ${
        hasRatings ? 'text-amber-400' : 'text-[var(--text-muted)]'
      } ${textSizes[size]} ${className}`}
      title={hasRatings ? `${displayRating} out of 5 (${liveCount} reviews)` : 'No dish reviews yet (0)'}
    >
      <Star
        className={`${starSizes[size]} ${
          hasRatings ? 'fill-amber-400 text-amber-400' : 'fill-none text-[var(--text-muted)]'
        } shrink-0`}
      />
      <span className="font-mono">{displayRating}</span>
      {showCount && (
        <span className="text-[10px] text-[var(--text-muted)] font-normal ml-0.5">
          ({liveCount})
        </span>
      )}
    </div>
  );
}
