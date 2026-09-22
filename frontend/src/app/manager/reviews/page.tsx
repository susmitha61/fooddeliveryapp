'use client';

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppSelector } from '@/store';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import {
  useGetRestaurantReviewsQuery,
  useGetRestaurantReviewSummaryQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '@/store/api/supportApi';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { ManagerStoreSwitcher } from '@/components/manager/ManagerStoreSwitcher';
import {
  Star, Store, Search, Filter, RefreshCw, MessageSquare,
  ShoppingBag, Utensils, ThumbsUp, HeartHandshake, ShieldAlert, Edit2, Trash2, X, Save, Sparkles
} from 'lucide-react';
import { getReviewDishName, getCleanReviewComment } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ManagerReviewsPage() {
  const [selectedRestId, setSelectedRestId] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'RESTAURANT' | 'MENU_ITEM' | 'PLATFORM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAppSelector((s) => s.auth);
  const isManager = user?.role === 'MANAGER';

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  // Fetch assigned restaurants
  const { data: myRestaurantsRes, isLoading: myRestsLoading, refetch: refetchMyRests } = useGetMyRestaurantsQuery();
  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  const currentRestaurantId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  useEffect(() => {
    if (myRestaurants.length > 0 && !selectedRestId) {
      setSelectedRestId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedRestId]);

  const {
    data: reviewsRes,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useGetRestaurantReviewsQuery(currentRestaurantId, {
    skip: !currentRestaurantId,
    pollingInterval: 3000,
  });

  const {
    data: summaryRes,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useGetRestaurantReviewSummaryQuery(currentRestaurantId, {
    skip: !currentRestaurantId,
    pollingInterval: 3000,
  });

  const rawReviews = extractArray(reviewsRes);
  const visibleReviews = rawReviews.filter((rev) => rev.isVisible !== false);
  const summary = summaryRes?.data;

  const restaurantReviewsCount = visibleReviews.filter((r) => r.reviewType !== 'MENU_ITEM' && !r.menuItemId && r.reviewType !== 'PLATFORM').length;
  const dishReviewsCount = visibleReviews.filter((r) => r.reviewType === 'MENU_ITEM' || Boolean(r.menuItemId)).length;
  const platformReviewsCount = visibleReviews.filter((r) => r.reviewType === 'PLATFORM' || r.targetType === 'PLATFORM').length;

  const filteredReviews = visibleReviews.filter((rev) => {
    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'RESTAURANT' && rev.reviewType !== 'MENU_ITEM' && !rev.menuItemId && rev.reviewType !== 'PLATFORM') ||
      (categoryFilter === 'MENU_ITEM' && (rev.reviewType === 'MENU_ITEM' || Boolean(rev.menuItemId))) ||
      (categoryFilter === 'PLATFORM' && (rev.reviewType === 'PLATFORM' || rev.targetType === 'PLATFORM'));

    const matchesRating = selectedRating === 'ALL' || rev.rating === selectedRating;
    const matchesSearch =
      (rev.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.menuItemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(rev.orderId || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesRating && matchesSearch;
  });

  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(reviewId).unwrap();
      toast.success('Review deleted successfully');
      refetchReviews();
      refetchSummary();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete review');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    const reviewId = editingReview.reviewId || editingReview.id;
    try {
      await updateReview({
        reviewId,
        body: {
          rating: editRating,
          comment: editComment.trim(),
        },
      }).unwrap();
      toast.success('Review updated successfully!');
      setEditingReview(null);
      refetchReviews();
      refetchSummary();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update review');
    }
  };

  const currentRest = myRestaurants.find((r) => r.id === currentRestaurantId);

  if (myRestsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasAssociatedRestaurant) {
    return <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Customer Reviews" />;
  }

  return (
    <div className="space-y-6">
      {/* Store Switcher */}
      {myRestaurants.length > 1 && (
        <ManagerStoreSwitcher
          restaurants={myRestaurants}
          selectedRestaurantId={currentRestaurantId}
          onSelectRestaurantId={setSelectedRestId}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title="Customer Reviews"
        description={`Monitor customer satisfaction, kitchen quality ratings, and diner comments for ${currentRest?.name || 'assigned store'}.`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetchReviews(); refetchSummary(); }}
              className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-emerald-500 rounded-xl text-xs font-bold transition-all"
              title="Refresh Reviews"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        }
      />

                {/* Filter & Search Bar */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      Active Store: <strong className="text-[var(--text-primary)]">{currentRest?.name || 'Selected Restaurant'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <div className="relative max-w-xs w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-[var(--background-color)] p-1 rounded-xl border border-[var(--border-color)]">
                      {(['ALL', 5, 4, 3, 2, 1] as const).map((r) => (
                        <button
                          key={String(r)}
                          onClick={() => setSelectedRating(r)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                            selectedRating === r
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {r === 'ALL' ? (
                            'All'
                          ) : (
                            <>
                              <span>{r}</span>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Segregation Filter Pills */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)]/60 overflow-x-auto pb-1 scrollbar-none w-full">
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        categoryFilter === 'ALL'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-[var(--background-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-black/20">
                        {visibleReviews.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setCategoryFilter('RESTAURANT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        categoryFilter === 'RESTAURANT'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[var(--background-color)] text-[var(--text-secondary)] hover:text-emerald-400 border border-[var(--border-color)]'
                      }`}
                    >
                      <span>🏪 Restaurant Reviews</span>
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
                      <span>🍽️ Dish / Item Reviews</span>
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
                      <span>🌐 Platform Reviews</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-black/20">
                        {platformReviewsCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Rating Summary Card */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                        <span className="font-outfit text-4xl font-extrabold text-[var(--text-primary)]">
                          {summary.averageRating && summary.averageRating > 0
                            ? summary.averageRating.toFixed(1)
                            : visibleReviews.length > 0
                            ? (visibleReviews.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / visibleReviews.length).toFixed(1)
                            : '0.0'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Average Rating</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Based on {summary.totalReviews || 0} reviews
                      </p>
                    </div>

                    <div className="md:col-span-3 bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-between">
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Rating Breakdown</p>
                      <div className="space-y-1.5">
                        {[
                          { star: 5, count: summary.fiveStars || 0 },
                          { star: 4, count: summary.fourStars || 0 },
                          { star: 3, count: summary.threeStars || 0 },
                          { star: 2, count: summary.twoStars || 0 },
                          { star: 1, count: summary.oneStar || 0 },
                        ].map(({ star, count }) => {
                          const total = summary.totalReviews || 1;
                          const percent = Math.round((count / total) * 100);
                          return (
                            <div key={star} className="flex items-center gap-3 text-xs">
                              <span className="w-12 flex items-center gap-1 font-bold text-[var(--text-secondary)]">
                                {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </span>
                              <div className="flex-1 h-2 bg-[var(--background-color)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="w-12 text-right font-mono font-semibold text-[var(--text-muted)]">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-outfit text-xl font-bold">
                      Customer Reviews for {currentRest?.name || 'Store'} ({filteredReviews.length})
                    </h2>
                  </div>

                  {reviewsLoading ? (
                    <div className="flex justify-center py-16">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : filteredReviews.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]">
                      <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                      <h3 className="font-outfit font-bold text-lg">No Reviews Found</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {visibleReviews.length === 0
                          ? 'This restaurant has not received any customer reviews yet.'
                          : 'No reviews match your selected filter criteria.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredReviews.map((rev) => (
                        <div
                          key={rev.reviewId || rev.id}
                          className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/30 transition-all"
                        >
                          <div className="space-y-2.5">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                                  {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                  <h3 className="font-outfit font-bold text-sm text-[var(--text-primary)]">
                                    {rev.userName || 'Verified Diner'}
                                  </h3>
                                  <p className="text-[11px] text-[var(--text-muted)]">
                                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span className="font-outfit font-extrabold text-xs text-amber-400">
                                    {rev.rating} / 5
                                  </span>
                                </div>

                                {user && (user.id === rev.userId || user.email === rev.userEmail || user.role === 'ADMIN' || user.role === 'MANAGER') && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingReview(rev);
                                        setEditRating(rev.rating || 5);
                                        setEditComment(rev.comment || '');
                                      }}
                                      className="p-1 rounded-lg hover:bg-[var(--background-color)] text-[var(--text-muted)] hover:text-amber-400 transition-colors"
                                      title="Edit Review"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(rev.reviewId || rev.id)}
                                      className="p-1 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                                      title="Delete Review"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
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

                              {rev.orderId && !String(rev.orderId).startsWith('ORD-GEN-') && !String(rev.orderId).startsWith('GEN-') ? (
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center gap-1">
                                  <ShoppingBag className="w-3 h-3" /> Order #{String(rev.orderId).slice(-6)}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> General Rating
                                </span>
                              )}
                            </div>

                            {/* Title & Comment */}
                            {rev.title && !rev.title.startsWith('Dish:') && (
                              <h4 className="font-bold text-sm text-[var(--text-primary)] pt-1">{rev.title}</h4>
                            )}
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--background-color)]/60 p-3 rounded-xl border border-[var(--border-color)]/60 italic">
                              &quot;{getCleanReviewComment(rev.comment) || 'No feedback comments left.'}&quot;
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <ThumbsUp className="w-3 h-3" /> Store Diner Feedback
                            </span>
                            <span>{currentRest?.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

        {/* Edit Review Modal */}
        {editingReview && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-extrabold text-lg">Edit Your Review</h3>
                <button
                  onClick={() => setEditingReview(null)}
                  className="p-1 rounded-xl hover:bg-[var(--background-color)] text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEditRating(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= editRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-outfit font-bold text-sm text-amber-400 ml-2">
                      {editRating}.0 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Review Comments
                  </label>
                  <textarea
                    rows={4}
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    required
                    placeholder="Update your feedback..."
                    className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingReview(null)}
                    className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
