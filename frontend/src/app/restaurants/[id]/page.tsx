'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RoleSidebar, GuestSidebar } from '@/components/layout/CustomerSidebar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { MenuItemCard } from '@/components/ui/MenuItemCard';
import { LoadingSpinner } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { RestaurantRatingBadge } from '@/components/ui/RestaurantRatingBadge';
import { DishRatingBadge } from '@/components/ui/DishRatingBadge';
import {
  useGetRestaurantByIdQuery,
  useGetRestaurantMenuQuery,
  useFilterMenuItemsQuery,
  useAddReviewMutation,
} from '@/store/api/restaurantApi';
import {
  useGetRestaurantReviewSummaryQuery,
  useGetRestaurantReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '@/store/api/supportApi';
import { useAppSelector } from '@/store';
import {
  Star,
  Clock,
  MapPin,
  Utensils,
  MessageSquare,
  Plus,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Store,
} from 'lucide-react';
import { getReviewDishName, getCleanReviewComment } from '@/lib/utils';
import toast from 'react-hot-toast';

function RestaurantDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { user: currentUser, isAuthenticated } = useAppSelector((s) => s.auth);

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'MENU' | 'REVIEWS'>(tabParam === 'reviews' ? 'REVIEWS' : 'MENU');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    if (tabParam === 'reviews') {
      setActiveTab('REVIEWS');
    }
  }, [tabParam]);

  // Modal for write/edit review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewType, setReviewType] = useState<'RESTAURANT' | 'MENU_ITEM'>('RESTAURANT');
  const [reviewMenuItemId, setReviewMenuItemId] = useState('');
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<'ALL' | 'RESTAURANT' | 'MENU_ITEM'>('ALL');

  const { data: restResponse, isLoading: restLoading } = useGetRestaurantByIdQuery(id, { skip: !id });
  const { data: menuResponse, isLoading: menuLoading } = useGetRestaurantMenuQuery(id, { skip: !id });
  const { data: filterRes } = useFilterMenuItemsQuery({ restaurantId: id }, { skip: !id });

  const { data: summaryRes } = useGetRestaurantReviewSummaryQuery(id, { skip: !id });
  const { data: reviewsRes, refetch: refetchReviews } = useGetRestaurantReviewsQuery(id, { skip: !id });

  const [addReview, { isLoading: isSubmittingReview }] = useAddReviewMutation();
  const [updateReview, { isLoading: isUpdatingReview }] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const restaurant = restResponse?.data;
  const menuCategories = menuResponse?.data?.categories || [];

  const summary = summaryRes?.data;
  const liveRating = Number(summary?.averageRating ?? 0);

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    return [];
  };

  const reviewsList = extractArray(reviewsRes);
  const liveCount = Number(summary?.totalReviews ?? (reviewsList.length > 0 ? reviewsList.length : (restaurant as any)?.totalRatings ?? 0));

  let computedRating = liveRating;
  if (computedRating <= 0 && reviewsList.length > 0) {
    const sum = reviewsList.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
    computedRating = sum / reviewsList.length;
  }
  if (computedRating <= 0 && restaurant?.rating && restaurant.rating > 0) {
    computedRating = restaurant.rating;
  }
  const hasRatings = liveCount > 0 && computedRating > 0;
  const displayRating = hasRatings ? computedRating.toFixed(1) : '0';

  const categorizedItems = menuCategories.flatMap((cat: any) =>
    (cat.items || []).map((item: any) => ({
      ...item,
      isSpicy: item.isSpicy,
      spicy: item.isSpicy,
      isVeg: item.isVegetarian ?? item.isVeg,
      vegetarian: item.isVegetarian ?? item.isVeg,
      isAvailable: item.isAvailable ?? true,
      available: item.isAvailable ?? true,
      categoryId: item.categoryId || cat.id,
      category: item.category || cat.name,
    }))
  );

  // Raw items from filter endpoint
  const rawItems: any[] = Array.isArray((filterRes?.data as any)?.content)
    ? (filterRes!.data as any).content
    : Array.isArray(filterRes?.data)
    ? filterRes.data
    : Array.isArray(filterRes)
    ? filterRes
    : [];

  // Combine and deduplicate all dishes so NO dish is ever lost
  const menuItems = React.useMemo(() => {
    const map = new Map<string, any>();

    // Add all categorized items
    categorizedItems.forEach((item: any) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });

    // Add all items from filter endpoint (including those with or without categoryId)
    rawItems.forEach((item: any) => {
      if (item && item.id) {
        const existing = map.get(item.id);
        map.set(item.id, {
          ...item,
          ...existing,
          isSpicy: item.isSpicy ?? existing?.isSpicy,
          spicy: item.isSpicy ?? existing?.spicy,
          isVeg: item.isVegetarian ?? item.isVeg ?? existing?.isVeg,
          vegetarian: item.isVegetarian ?? item.isVeg ?? existing?.vegetarian,
          isAvailable: item.isAvailable ?? existing?.isAvailable ?? true,
          available: item.isAvailable ?? existing?.available ?? true,
          categoryId: item.categoryId ?? existing?.categoryId ?? null,
          category: item.category ?? existing?.category ?? 'General Menu',
        });
      }
    });

    // Also check bestSellers and todaysSpecials from menuResponse
    const bestSellers = menuResponse?.data?.bestSellers || [];
    bestSellers.forEach((item: any) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    const specials = menuResponse?.data?.todaysSpecials || [];
    specials.forEach((item: any) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }, [categorizedItems, rawItems, menuResponse]);

  const uncategorizedItems = menuItems.filter((item: any) => !item.categoryId);

  const filteredItems =
    activeCategory === 'ALL'
      ? menuItems
      : activeCategory === 'Uncategorized'
      ? uncategorizedItems
      : menuItems.filter(
          (i: any) => i.categoryId === activeCategory || i.category === activeCategory
        );

  const defaultBanner = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80';

  const handleOpenAddReview = () => {
    if (!isAuthenticated) {
      toast.error('Please login to post a review');
      return;
    }
    setEditingReview(null);
    setReviewRating(5);
    setReviewComment('');
    setReviewType('RESTAURANT');
    setReviewMenuItemId('');
  };

  const handleOpenEditReview = (rev: any) => {
    setEditingReview(rev);
    setReviewRating(rev.rating || 5);
    setReviewComment(rev.comment || '');
    setReviewType(rev.reviewType === 'MENU_ITEM' || rev.menuItemId ? 'MENU_ITEM' : 'RESTAURANT');
    setReviewMenuItemId(rev.menuItemId || (menuItems.length > 0 ? menuItems[0].id : ''));
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setEditingReview(null);
    setReviewRating(5);
    setReviewComment('');
    setReviewType('RESTAURANT');
    setReviewMenuItemId('');
  };

  // Auto-select first dish if reviewType is MENU_ITEM
  React.useEffect(() => {
    if (reviewType === 'MENU_ITEM' && menuItems.length > 0) {
      if (!reviewMenuItemId || !menuItems.some((i: any) => i.id === reviewMenuItemId)) {
        setReviewMenuItemId(menuItems[0].id);
      }
    }
  }, [reviewType, menuItems, reviewMenuItemId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error('Please enter review comments');
      return;
    }

    const effectiveItemId = reviewType === 'MENU_ITEM'
      ? reviewMenuItemId || (menuItems.length > 0 ? menuItems[0].id : undefined)
      : undefined;

    if (reviewType === 'MENU_ITEM' && !effectiveItemId) {
      toast.error('Please select a dish/menu item to review');
      return;
    }

    const selectedItem = menuItems.find((i: any) => i.id === effectiveItemId);
    const dishName = selectedItem?.name || editingReview?.menuItemName || 'Dish Item';

    try {
      if (editingReview) {
        const reviewId = editingReview.id || editingReview.reviewId;
        await updateReview({
          reviewId,
          body: {
            reviewType,
            restaurantId: id,
            menuItemId: reviewType === 'MENU_ITEM' ? effectiveItemId : undefined,
            menuItemName: reviewType === 'MENU_ITEM' ? dishName : undefined,
            title: reviewType === 'MENU_ITEM' ? `Dish: ${dishName}` : undefined,
            rating: reviewRating,
            comment: reviewComment.trim(),
          },
        }).unwrap();
        toast.success('Your review has been updated!');
      } else {
        // Seamless general order ID so user is never blocked or prompted for an order ID
        const genOrderId = `ORD-GEN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const isDish = reviewType === 'MENU_ITEM';
        const hasValidCategory = isDish && Boolean(selectedItem?.categoryId);

        if (isDish && !hasValidCategory) {
          await addReview({
            reviewType: 'RESTAURANT',
            orderId: genOrderId,
            restaurantId: id,
            menuItemId: effectiveItemId,
            menuItemName: dishName,
            title: `Dish: ${dishName}`,
            rating: reviewRating,
            comment: reviewComment.trim().startsWith('[Dish:')
              ? reviewComment.trim()
              : `[Dish: ${dishName}] ${reviewComment.trim()}`,
          } as any).unwrap();
        } else {
          try {
            await addReview({
              reviewType: isDish ? 'MENU_ITEM' : 'RESTAURANT',
              orderId: genOrderId,
              restaurantId: id,
              menuItemId: isDish ? effectiveItemId : undefined,
              menuItemName: isDish ? dishName : undefined,
              title: isDish ? `Dish: ${dishName}` : undefined,
              rating: reviewRating,
              comment: reviewComment.trim(),
            } as any).unwrap();
          } catch (firstErr: any) {
            if (
              isDish &&
              (firstErr?.data?.errorCode === 'CATEGORY_NOT_FOUND' ||
                String(firstErr?.data?.message || '').toLowerCase().includes('category'))
            ) {
              // Graceful auto-fallback for uncategorized item review
              await addReview({
                reviewType: 'RESTAURANT',
                orderId: genOrderId,
                restaurantId: id,
                menuItemId: effectiveItemId,
                menuItemName: dishName,
                title: `Dish: ${dishName}`,
                rating: reviewRating,
                comment: `[Dish: ${dishName}] ${reviewComment.trim()}`,
              } as any).unwrap();
            } else {
              throw firstErr;
            }
          }
        }
        toast.success('🎉 Thank you! Your review was posted.');
      }
      handleCloseReviewModal();
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async (rev: any) => {
    const reviewId = rev.id || rev.reviewId;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview(reviewId).unwrap();
      toast.success('Review deleted');
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
      <Header />
      {isAuthenticated && currentUser?.role === 'CUSTOMER' && <CartDrawer />}

      <div className="flex-1 flex">
        {isAuthenticated ? <RoleSidebar role={currentUser?.role} /> : <GuestSidebar />}

        <main className="flex-1 overflow-x-hidden">
          {restLoading || menuLoading ? (
            <div className="flex items-center justify-center py-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Hero Banner */}
              <div className="relative h-64 sm:h-80 w-full bg-neutral-900">
                <Image
                  src={restaurant?.imageUrl || defaultBanner}
                  alt={restaurant?.name || 'Restaurant'}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-color)] via-black/40 to-black/20" />

                <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--primary-color)] text-white mb-2 inline-block shadow-md">
                      {restaurant?.cuisineType || 'Multi-Cuisine'}
                    </span>
                    <h1 className="font-outfit text-3xl sm:text-5xl font-extrabold text-white">
                      {restaurant?.name || 'Restaurant'}
                    </h1>
                    <p className="text-sm text-neutral-300 line-clamp-1 mt-1 max-w-xl">
                      {restaurant?.description || 'Serving authentic taste and fast delivery.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-[var(--surface-color)]/90 backdrop-blur-md border border-[var(--border-color)] p-3.5 rounded-2xl shadow-xl shrink-0">
                    {/* Live Shared Restaurant Rating Badge */}
                    <RestaurantRatingBadge
                      restaurantId={id}
                      initialRating={restaurant?.rating}
                      initialCount={restaurant?.totalRatings}
                      size="md"
                    />
                    <div className="h-4 w-px bg-[var(--border-color)]" />
                    <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                      <span>{restaurant?.deliveryTimeMinutes || '30'} mins</span>
                    </div>
                  </div>
                </div>
              </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                  {/* Top Switcher: Menu vs Customer Reviews */}
                  <div className="flex items-center gap-4 mb-6 border-b border-[var(--border-color)] pb-3">
                    <button
                      onClick={() => setActiveTab('MENU')}
                      className={`font-outfit text-base font-bold pb-2 transition-all relative flex items-center gap-2 ${
                        activeTab === 'MENU'
                          ? 'text-[var(--primary-color)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Explore Menu ({menuItems.length})</span>
                      {activeTab === 'MENU' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)] rounded-full" />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('REVIEWS')}
                      className={`font-outfit text-base font-bold pb-2 transition-all relative flex items-center gap-2 ${
                        activeTab === 'REVIEWS'
                          ? 'text-[var(--primary-color)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Customer Reviews ({liveCount})</span>
                      {activeTab === 'REVIEWS' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-color)] rounded-full" />
                      )}
                    </button>
                  </div>

                  {/* TAB 1: MENU ITEMS */}
                  {activeTab === 'MENU' && (
                    <>
                      {(menuCategories.length > 0 || uncategorizedItems.length > 0) && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-[var(--border-color)]">
                          <button
                            onClick={() => setActiveCategory('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                              activeCategory === 'ALL'
                                ? 'bg-[var(--primary-color)] text-white shadow-md'
                                : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            All Items ({menuItems.length})
                          </button>
                          {menuCategories.map((cat) => (
                            <button
                              key={cat.id || cat.name}
                              onClick={() => setActiveCategory(cat.id || cat.name)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                activeCategory === (cat.id || cat.name)
                                  ? 'bg-[var(--primary-color)] text-white shadow-md'
                                  : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                          {uncategorizedItems.length > 0 && (
                            <button
                              onClick={() => setActiveCategory('Uncategorized')}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                activeCategory === 'Uncategorized'
                                  ? 'bg-[var(--primary-color)] text-white shadow-md'
                                  : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              Uncategorized ({uncategorizedItems.length})
                            </button>
                          )}
                        </div>
                      )}

                      {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredItems.map((item: any) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              restaurantId={id}
                              restaurantName={restaurant?.name || 'Restaurant'}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-2xl">
                          <Utensils className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                          <p className="text-sm text-[var(--text-secondary)]">
                            No menu items found in this category.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: LIVE CUSTOMER REVIEWS */}
                  {activeTab === 'REVIEWS' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex flex-col items-center justify-center font-extrabold">
                            <span className="text-2xl">{displayRating}</span>
                            <div className="flex text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-outfit font-bold text-lg">Overall Guest Rating</h3>
                            <p className="text-xs text-[var(--text-secondary)]">
                              Based on {liveCount} customer ratings and dining reviews.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleOpenAddReview}
                          className="px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Write a Review</span>
                        </button>
                      </div>

                      {/* Category Segregation Filter Pills */}
                      {reviewsList.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                          <button
                            onClick={() => setReviewCategoryFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                              reviewCategoryFilter === 'ALL'
                                ? 'bg-[var(--primary-color)] text-white shadow-xs'
                                : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}
                          >
                            All Reviews ({reviewsList.length})
                          </button>
                          <button
                            onClick={() => setReviewCategoryFilter('RESTAURANT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                              reviewCategoryFilter === 'RESTAURANT'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}
                          >
                            🏪 Restaurant ({reviewsList.filter((r: any) => r.reviewType !== 'MENU_ITEM' && !r.menuItemId).length})
                          </button>
                          <button
                            onClick={() => setReviewCategoryFilter('MENU_ITEM')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                              reviewCategoryFilter === 'MENU_ITEM'
                                ? 'bg-sky-500 text-white shadow-xs'
                                : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}
                          >
                            🍽️ Dish Items ({reviewsList.filter((r: any) => r.reviewType === 'MENU_ITEM' || Boolean(r.menuItemId)).length})
                          </button>
                        </div>
                      )}

                      {/* Reviews List */}
                      {reviewsList.length === 0 ? (
                        <EmptyState
                          icon={MessageSquare}
                          title="No Customer Reviews Yet"
                          description="Be the first to order and share your honest feedback with the community!"
                          action={{
                            label: 'Write the First Review',
                            onClick: handleOpenAddReview,
                          }}
                        />
                      ) : (
                        <div className="space-y-3">
                          {reviewsList
                            .filter((rev: any) => {
                              if (reviewCategoryFilter === 'RESTAURANT') return rev.reviewType !== 'MENU_ITEM' && !rev.menuItemId;
                              if (reviewCategoryFilter === 'MENU_ITEM') return rev.reviewType === 'MENU_ITEM' || Boolean(rev.menuItemId);
                              return true;
                            })
                            .map((rev: any) => {
                            const isAuthor =
                              currentUser?.id &&
                              (rev.userId === currentUser.id ||
                                rev.userId === (currentUser as any).userId ||
                                currentUser.role === 'ADMIN');

                            return (
                              <div
                                key={rev.id || rev.reviewId}
                                className="p-5 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3"
                              >
                                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-400 font-bold text-xs">
                                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                                      <span>{(Number(rev.rating) || 5).toFixed(1)}</span>
                                    </div>
                                    <span className="font-bold text-xs text-[var(--text-primary)]">
                                      {rev.userName || 'Verified Diner'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recently'}
                                    </span>

                                    {/* Author Edit / Delete Permissions */}
                                    {isAuthor && (
                                      <div className="flex items-center gap-1 ml-2">
                                        <button
                                          onClick={() => handleOpenEditReview(rev)}
                                          className="p-1.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary-color)]"
                                          title="Edit Your Review"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteReview(rev)}
                                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                          title="Delete Review"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Category Tag */}
                                <div className="flex items-center gap-2">
                                  {rev.reviewType === 'MENU_ITEM' || rev.menuItemId ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                                      <Utensils className="w-3 h-3" />
                                      <span>Dish Review: {getReviewDishName(rev)}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                      <Store className="w-3 h-3" />
                                      <span>Restaurant Experience</span>
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                  &quot;{getCleanReviewComment(rev.comment) || 'Delicious meal, fast delivery!'}&quot;
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        {/* Modal: Write or Edit Review */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>{editingReview ? 'Edit Your Review' : `Review ${restaurant?.name || 'Restaurant'}`}</span>
                </h3>
                <button onClick={handleCloseReviewModal} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Review Target Selection */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    What are you reviewing? *
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setReviewType('RESTAURANT')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        reviewType === 'RESTAURANT'
                          ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-xs'
                          : 'bg-[var(--background-color)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Restaurant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewType('MENU_ITEM');
                        if (!reviewMenuItemId && menuItems.length > 0) setReviewMenuItemId(menuItems[0].id);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        reviewType === 'MENU_ITEM'
                          ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-xs'
                          : 'bg-[var(--background-color)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Specific Dish</span>
                    </button>
                  </div>

                  {reviewType === 'MENU_ITEM' && (
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                        Select Dish / Menu Item *
                      </label>
                      {menuItems.length > 0 ? (
                        <select
                          value={reviewMenuItemId}
                          onChange={(e) => setReviewMenuItemId(e.target.value)}
                          className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                          required
                        >
                          <option value="">-- Choose a dish to rate --</option>
                          {menuItems.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.name} (₹{item.price})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-muted)]">
                          Loading dishes for this restaurant...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex items-center justify-center gap-2 p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Comments & Experience *
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how the food tasted, packing, and service..."
                    className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)] resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseReviewModal}
                    className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || isUpdatingReview}
                    className="px-5 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60"
                  >
                    {editingReview ? (isUpdatingReview ? 'Saving...' : 'Update Review') : (isSubmittingReview ? 'Posting...' : 'Post Review')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}

export default function RestaurantDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <RestaurantDetailContent />
    </Suspense>
  );
}
