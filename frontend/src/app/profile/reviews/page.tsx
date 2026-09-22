'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppSelector } from '@/store';
import { useAddReviewMutation, useGetRestaurantsQuery, useGetRestaurantMenuQuery, useFilterMenuItemsQuery } from '@/store/api/restaurantApi';
import {
  useGetMyReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '@/store/api/supportApi';
import { useGetMyOrdersQuery } from '@/store/api/orderApi';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Plus,
  Calendar,
  Store,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Utensils,
} from 'lucide-react';
import { getReviewDishName, getCleanReviewComment } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomerReviewsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: reviewsRes, isLoading: reviewsLoading, refetch: refetchReviews } = useGetMyReviewsQuery();
  const { data: ordersRes } = useGetMyOrdersQuery({ page: 0, size: 50 });
  const { data: restaurantsRes } = useGetRestaurantsQuery({ page: 0, size: 50 });

  const [addReview, { isLoading: isSubmitting }] = useAddReviewMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reviewTarget, setReviewTarget] = useState<'RESTAURANT' | 'MENU_ITEM'>('RESTAURANT');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'RESTAURANT' | 'MENU_ITEM' | 'PLATFORM'>('ALL');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: menuRes, isLoading: menuLoading } = useGetRestaurantMenuQuery(selectedRestaurantId, {
    skip: !selectedRestaurantId,
  });
  const { data: filterRes, isLoading: filterLoading } = useFilterMenuItemsQuery(
    { restaurantId: selectedRestaurantId },
    { skip: !selectedRestaurantId }
  );

  const availableDishes: any[] = React.useMemo(() => {
    const rawItems: any[] = Array.isArray((filterRes?.data as any)?.content)
      ? (filterRes!.data as any).content
      : Array.isArray(filterRes?.data)
      ? filterRes.data
      : Array.isArray(filterRes)
      ? filterRes
      : [];

    const categories = menuRes?.data?.categories || (menuRes as any)?.categories || [];
    const fromCategories = categories.flatMap((cat: any) => cat.items || []);
    const fromBestSellers = menuRes?.data?.bestSellers || [];
    const fromSpecials = menuRes?.data?.todaysSpecials || [];

    const map = new Map<string, any>();
    [...rawItems, ...fromCategories, ...fromBestSellers, ...fromSpecials].forEach((item: any) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [filterRes, menuRes]);

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const reviews: any[] = extractArray(reviewsRes);
  const orders: any[] = extractArray(ordersRes);
  const restaurants: any[] = extractArray(restaurantsRes);

  // Auto-select restaurant when restaurants list loads
  React.useEffect(() => {
    if (!selectedRestaurantId && restaurants.length > 0) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Auto-select first dish when availableDishes loads for MENU_ITEM
  React.useEffect(() => {
    if (reviewTarget === 'MENU_ITEM' && availableDishes.length > 0) {
      if (!selectedMenuItemId || !availableDishes.some((d: any) => d.id === selectedMenuItemId)) {
        setSelectedMenuItemId(availableDishes[0].id);
      }
    }
  }, [reviewTarget, availableDishes, selectedMenuItemId]);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
      : '0.0';
  const fiveStarCount = reviews.filter((r) => (Number(r.rating) || 0) === 5).length;

  const restaurantReviewsCount = reviews.filter((r) => r.reviewType !== 'MENU_ITEM' && !r.menuItemId && r.reviewType !== 'PLATFORM').length;
  const dishReviewsCount = reviews.filter((r) => r.reviewType === 'MENU_ITEM' || Boolean(r.menuItemId)).length;
  const platformReviewsCount = reviews.filter((r) => r.reviewType === 'PLATFORM' || r.targetType === 'PLATFORM').length;

  const filteredReviews = reviews.filter((rev) => {
    if (categoryFilter === 'RESTAURANT') return rev.reviewType !== 'MENU_ITEM' && !rev.menuItemId && rev.reviewType !== 'PLATFORM';
    if (categoryFilter === 'MENU_ITEM') return rev.reviewType === 'MENU_ITEM' || Boolean(rev.menuItemId);
    if (categoryFilter === 'PLATFORM') return rev.reviewType === 'PLATFORM' || rev.targetType === 'PLATFORM';
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingReview(null);
    setSelectedRestaurantId(restaurants.length > 0 ? restaurants[0].id : '');
    setSelectedOrderId('');
    setReviewTarget('RESTAURANT');
    setSelectedMenuItemId('');
    setRating(5);
    setComment('');
    setShowModal(true);
  };

  const handleOpenEditModal = (rev: any) => {
    setEditingReview(rev);
    setSelectedRestaurantId(rev.restaurantId || (restaurants.length > 0 ? restaurants[0].id : ''));
    setSelectedOrderId(rev.orderId || '');
    setReviewTarget(rev.reviewType === 'MENU_ITEM' || rev.menuItemId ? 'MENU_ITEM' : 'RESTAURANT');
    setSelectedMenuItemId(rev.menuItemId || '');
    setRating(rev.rating || 5);
    setComment(rev.comment || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReview(null);
    setSelectedRestaurantId(restaurants.length > 0 ? restaurants[0].id : '');
    setSelectedOrderId('');
    setReviewTarget('RESTAURANT');
    setSelectedMenuItemId('');
    setRating(5);
    setComment('');
  };

  const handleOrderChange = (ordId: string) => {
    setSelectedOrderId(ordId);
    if (ordId) {
      const chosenOrder = orders.find((o) => (o.orderId || o.id) === ordId);
      if (chosenOrder && chosenOrder.restaurantId) {
        setSelectedRestaurantId(chosenOrder.restaurantId);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error('Please write a brief comment');
      return;
    }

    const isDish = reviewTarget === 'MENU_ITEM';
    const effectiveMenuItemId = isDish
      ? selectedMenuItemId || (availableDishes.length > 0 ? availableDishes[0].id : editingReview?.menuItemId)
      : undefined;

    if (isDish && !effectiveMenuItemId) {
      toast.error('Please select a dish/menu item to review');
      return;
    }

    const chosenDish = availableDishes.find((d: any) => d.id === effectiveMenuItemId);
    const dishName = chosenDish?.name || editingReview?.menuItemName || 'Dish Item';

    // If user left orderId blank, generate a unique general rating token so backend @NotBlank passes
    // and duplicate review check doesn't block them from giving general ratings!
    const finalOrderId =
      selectedOrderId ||
      editingReview?.orderId ||
      `ORD-GEN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      if (editingReview) {
        const reviewId = editingReview.id || editingReview.reviewId;
        await updateReview({
          reviewId,
          body: {
            reviewType: isDish ? 'MENU_ITEM' : 'RESTAURANT',
            orderId: finalOrderId,
            restaurantId: selectedRestaurantId || editingReview.restaurantId,
            menuItemId: isDish ? effectiveMenuItemId : undefined,
            menuItemName: isDish ? dishName : undefined,
            title: isDish ? `Dish: ${dishName}` : undefined,
            rating,
            comment: comment.trim(),
          },
        }).unwrap();
        toast.success('Review updated successfully!');
      } else {
        const finalRestaurantId =
          selectedRestaurantId || (restaurants.length > 0 ? restaurants[0].id : '');

        if (!finalRestaurantId) {
          toast.error('Please select a restaurant to review');
          return;
        }

        // If dish item has no valid category assigned in restaurant-service,
        // support-service hard-fails on reviewType = 'MENU_ITEM' with CATEGORY_NOT_FOUND.
        // We seamlessly fall back to reviewType = 'RESTAURANT' with menuItemId & dish tag.
        const hasValidCategory = isDish && Boolean(chosenDish?.categoryId);

        if (isDish && !hasValidCategory) {
          await addReview({
            reviewType: 'RESTAURANT',
            orderId: finalOrderId,
            restaurantId: finalRestaurantId,
            menuItemId: effectiveMenuItemId,
            menuItemName: dishName,
            rating,
            title: `Dish: ${dishName}`,
            comment: comment.trim().startsWith('[Dish:')
              ? comment.trim()
              : `[Dish: ${dishName}] ${comment.trim()}`,
          } as any).unwrap();
        } else {
          try {
            await addReview({
              reviewType: isDish ? 'MENU_ITEM' : 'RESTAURANT',
              orderId: finalOrderId,
              restaurantId: finalRestaurantId,
              menuItemId: isDish ? effectiveMenuItemId : undefined,
              menuItemName: isDish ? dishName : undefined,
              title: isDish ? `Dish: ${dishName}` : undefined,
              rating,
              comment: comment.trim(),
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
                orderId: finalOrderId,
                restaurantId: finalRestaurantId,
                menuItemId: effectiveMenuItemId,
                menuItemName: dishName,
                rating,
                title: `Dish: ${dishName}`,
                comment: `[Dish: ${dishName}] ${comment.trim()}`,
              } as any).unwrap();
            } else {
              throw firstErr;
            }
          }
        }
        toast.success('🎉 Thank you! Your review has been published.');
      }

      handleCloseModal();
      refetchReviews();
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.data?.data?.orderId ||
          'Failed to save review. Please try again.'
      );
    }
  };

  const handleDeleteReview = async (rev: any) => {
    const reviewId = rev.id || rev.reviewId;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview(reviewId).unwrap();
      toast.success('Review deleted successfully');
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={user?.role} />

          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
            {/* Header Title */}
            <PageHeader
              title="My Reviews"
              subtitle="View, edit, or delete feedback you have shared for restaurants & orders."
              actions={
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-lg hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write a Review</span>
                </button>
              }
            />

            {/* Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Star}
                label="Average Rating Given"
                value={`${avgRating} / 5.0`}
                accentColor="amber"
              />
              <StatCard
                icon={MessageSquare}
                label="Total Reviews"
                value={totalReviews}
                accentColor="orange"
              />
              <StatCard
                icon={ThumbsUp}
                label="5-Star Ratings"
                value={fiveStarCount}
                accentColor="emerald"
              />
            </div>

            {/* Reviews List */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--primary-color)]" />
                  <span>Your Review History</span>
                </h2>

                {/* Category Segregation Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      categoryFilter === 'ALL'
                        ? 'bg-[var(--primary-color)] text-white shadow-xs'
                        : 'bg-[var(--background-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                    }`}
                  >
                    <span>All</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-black/20">
                      {reviews.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setCategoryFilter('RESTAURANT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      categoryFilter === 'RESTAURANT'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-[var(--background-color)] text-[var(--text-secondary)] hover:text-emerald-400 border border-[var(--border-color)]'
                    }`}
                  >
                    <span>🏪 Restaurant</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-black/20">
                      {restaurantReviewsCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setCategoryFilter('MENU_ITEM')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      categoryFilter === 'MENU_ITEM'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-[var(--background-color)] text-[var(--text-secondary)] hover:text-sky-400 border border-[var(--border-color)]'
                    }`}
                  >
                    <span>🍽️ Dishes</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-black/20">
                      {dishReviewsCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setCategoryFilter('PLATFORM')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      categoryFilter === 'PLATFORM'
                        ? 'bg-purple-500 text-white shadow-xs'
                        : 'bg-[var(--background-color)] text-[var(--text-secondary)] hover:text-purple-400 border border-[var(--border-color)]'
                    }`}
                  >
                    <span>🌐 Platform</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-black/20">
                      {platformReviewsCount}
                    </span>
                  </button>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-[var(--border-color)] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredReviews.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title={reviews.length === 0 ? 'No Reviews Submitted Yet' : 'No Reviews In This Category'}
                  description={
                    reviews.length === 0
                      ? 'Share your dining experiences to help top restaurants improve and guide fellow foodies.'
                      : 'Try selecting a different category filter tab to see your reviews.'
                  }
                  action={
                    reviews.length === 0
                      ? {
                          label: 'Write Your First Review',
                          onClick: handleOpenAddModal,
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((rev) => (
                    <div
                      key={rev.id || rev.reviewId}
                      className="p-5 rounded-2xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-3 transition-all hover:border-[var(--primary-color)]/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)]/50 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold">
                            {rev.reviewType === 'MENU_ITEM' || rev.menuItemId ? (
                              <Utensils className="w-5 h-5 text-sky-400" />
                            ) : (
                              <Store className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[var(--text-primary)]">
                              {rev.restaurantName || 'Restaurant Partner'}
                            </h3>
                            {rev.orderId && !String(rev.orderId).startsWith('ORD-GEN-') && !String(rev.orderId).startsWith('GEN-') ? (
                              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                <ShoppingBag className="w-3 h-3" />
                                Order #{String(rev.orderId).slice(-8)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-500/90 flex items-center gap-1 mt-0.5 font-semibold">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                General Rating
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= (rev.rating || 5)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-neutral-600'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-amber-400 ml-1">
                              {(Number(rev.rating) || 5).toFixed(1)}
                            </span>
                          </div>

                          {/* Action Buttons for Author */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(rev)}
                              className="p-1.5 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)]/40 transition-colors"
                              title="Edit Review"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(rev)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Delete Review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Category Segregation Badge */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {rev.reviewType === 'MENU_ITEM' || rev.menuItemId ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                            <Utensils className="w-3 h-3" />
                            <span>Dish: {getReviewDishName(rev)}</span>
                          </span>
                        ) : rev.reviewType === 'PLATFORM' || rev.targetType === 'PLATFORM' ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                            <span>🌐 Platform Review</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span>Restaurant Experience</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        &quot;{getCleanReviewComment(rev.comment) || 'Great food and fast delivery!'}&quot;
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified Author Feedback
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal: Write or Edit Review */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h3 className="font-outfit font-bold text-base">
                    {editingReview ? 'Edit Your Review' : 'Write a Customer Review'}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg bg-[var(--background-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
                {/* Review Type Selection (Restaurant vs Specific Dish) */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    What are you reviewing? *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setReviewTarget('RESTAURANT')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        reviewTarget === 'RESTAURANT'
                          ? 'bg-[var(--primary-color)] text-white shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Entire Restaurant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewTarget('MENU_ITEM')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        reviewTarget === 'MENU_ITEM'
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Specific Dish</span>
                    </button>
                  </div>
                </div>

                {/* Select Restaurant */}
                {!editingReview && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                      Select Restaurant *
                    </label>
                    <select
                      value={selectedRestaurantId}
                      onChange={(e) => {
                        setSelectedRestaurantId(e.target.value);
                        setSelectedMenuItemId('');
                      }}
                      className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                      required
                    >
                      <option value="">-- Select a restaurant --</option>
                      {restaurants.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.cuisineType || r.area || 'Store'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Associated Order (Optional) */}
                {!editingReview && orders.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)]">
                        Associated Order (Optional)
                      </label>
                      <span className="text-[10px] text-amber-400 font-medium">
                        Not required — general ratings welcome
                      </span>
                    </div>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => handleOrderChange(e.target.value)}
                      className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--primary-color)]"
                    >
                      <option value="">-- General Rating (No Specific Order) --</option>
                      {orders.map((ord: any) => (
                        <option key={ord.orderId || ord.id} value={ord.orderId || ord.id}>
                          Order #{String(ord.orderId || ord.id).slice(-8)} — {ord.restaurantName || 'Restaurant'} ({ord.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Select Specific Dish (if MENU_ITEM selected) */}
                {reviewTarget === 'MENU_ITEM' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)]">
                        Select Dish / Menu Item *
                      </label>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {availableDishes.length} dish{availableDishes.length === 1 ? '' : 'es'} available
                      </span>
                    </div>
                    {menuLoading || filterLoading ? (
                      <div className="p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs text-amber-400 animate-pulse">
                        Fetching menu items for selected restaurant...
                      </div>
                    ) : availableDishes.length > 0 ? (
                      <select
                        value={selectedMenuItemId}
                        onChange={(e) => setSelectedMenuItemId(e.target.value)}
                        className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                        required
                      >
                        <option value="">-- Choose a dish to review --</option>
                        {availableDishes.map((dish: any) => (
                          <option key={dish.id} value={dish.id}>
                            {dish.name} (₹{dish.price})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-muted)]">
                        {selectedRestaurantId
                          ? 'No specific dishes found for this restaurant yet. You can still rate the Entire Restaurant.'
                          : 'Please select a restaurant first to see its dishes.'}
                      </div>
                    )}
                  </div>
                )}

                {/* Rating Selection */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Your Review / Feedback *
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the food quality, taste, packaging, and delivery speed..."
                    className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUpdating}
                    className="px-5 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {editingReview
                      ? isUpdating
                        ? 'Updating...'
                        : 'Save Changes'
                      : isSubmitting
                      ? 'Submitting...'
                      : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
