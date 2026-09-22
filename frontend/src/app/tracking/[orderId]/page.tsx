'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner, Badge } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppSelector } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { useAddReviewMutation } from '@/store/api/restaurantApi';
import {
  useTrackOrderQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useAssignDriverMutation,
  useUpdateOrderStatusMutation,
  useGetOwnerOrdersQuery,
  useGetDriverOrdersQuery,
} from '@/store/api/orderApi';
import { formatCurrency, formatDate, isDriverAssignedToOrder, isOrderUnassigned } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Car,
  Store,
  ShoppingBag,
  ArrowLeft,
  XCircle,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Truck,
  RefreshCw,
  X,
  UserCheck,
  Star,
  Receipt,
  RotateCcw,
  Check,
  ExternalLink,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 'PENDING', title: 'Order Placed', desc: 'Waiting for restaurant confirmation' },
  { id: 'CONFIRMED', title: 'Order Confirmed', desc: 'Kitchen accepted your order' },
  { id: 'PREPARING', title: 'Preparing Food', desc: 'Chef is cooking your dish' },
  { id: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Driver is on the way to you' },
  { id: 'DELIVERED', title: 'Order Delivered', desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const dispatch = useDispatch();
  const params = useParams();
  const orderId = params?.orderId as string;
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role || 'CUSTOMER';
  const isAdmin = role === 'ADMIN';
  const isDriver = role === 'DELIVERY_DRIVER';
  const isStaff = ['ADMIN', 'MANAGER', 'RESTAURANT_OWNER'].includes(role);

  // Driver re-assignment modal state (ADMIN only)
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverPhone, setDriverPhone] = useState('9876543210');
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('MH-01-AB-1234');

  // Cancel dialog & Review prompt states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReviewPromptModal, setShowReviewPromptModal] = useState(false);
  const [hasPromptedReview, setHasPromptedReview] = useState(false);
  const [promptRating, setPromptRating] = useState(5);
  const [promptComment, setPromptComment] = useState('');
  const [isTrackingEnded, setIsTrackingEnded] = useState(false);

  const [addReview, { isLoading: isSubmittingReview }] = useAddReviewMutation();

  const { data: usersRes } = useGetAllUsersQuery({ page: 0, size: 100 }, { skip: !isAdmin });
  const { data: allOrdersRes } = useGetOwnerOrdersQuery({ page: 0, size: 100 }, { skip: !isAdmin });
  const { data: driverOrdersRes } = useGetDriverOrdersQuery(
    { page: 0, size: 50 },
    { skip: !isDriver || isTrackingEnded, pollingInterval: isTrackingEnded ? 0 : 3000 }
  );

  const [assignDriver, { isLoading: isAssigning }] = useAssignDriverMutation();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const {
    data: trackingRes,
    isLoading: trackingLoading,
    refetch: refetchTracking,
  } = useTrackOrderQuery(orderId, {
    skip: !orderId,
    pollingInterval: isTrackingEnded ? 0 : 3000,
  });

  const {
    data: orderRes,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
    pollingInterval: isTrackingEnded ? 0 : 3000,
  });

  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const tracking = trackingRes?.data;
  const order = orderRes?.data;

  const currentStatus = (tracking?.status || order?.status || 'PENDING').toUpperCase();
  const isDelivered = currentStatus === 'DELIVERED';
  const isCancelled = currentStatus === 'CANCELLED';
  const isTerminal = isDelivered || isCancelled;
  const isCancellable = ['PLACED', 'PENDING', 'CONFIRMED'].includes(currentStatus);

  // Stop polling when terminal status is reached
  useEffect(() => {
    if (isTerminal) {
      setIsTrackingEnded(true);
    }
  }, [isTerminal]);

  // C-03: Auto-prompt review modal when order transitions to DELIVERED for customer
  useEffect(() => {
    if (isDelivered && role === 'CUSTOMER' && !hasPromptedReview) {
      const alreadyPrompted = typeof window !== 'undefined' && sessionStorage.getItem(`prompted_review_${orderId}`);
      if (!alreadyPrompted) {
        setHasPromptedReview(true);
        setShowReviewPromptModal(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`prompted_review_${orderId}`, 'true');
        }
      }
    }
  }, [isDelivered, role, hasPromptedReview, orderId]);

  // Parse driver deliveries to enforce single active delivery rule
  const extractDriverArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const driverOrdersList = extractDriverArray(driverOrdersRes);
  const activeDriverOrders = driverOrdersList.filter(
    (o) => isDriverAssignedToOrder(o, user) && !['DELIVERED', 'CANCELLED'].includes(o.status)
  );
  const driverHasActiveDelivery = activeDriverOrders.length > 0;
  const currentDriverActiveOrder = activeDriverOrders[0];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PLACED':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(currentStatus);
  const items: any[] = order?.items || [];

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelOrder({ orderId, reason: 'Cancelled by customer from tracking page' }).unwrap();
      toast.success('Order cancelled successfully.');
      dispatch(
        addNotification({
          title: 'Order Cancelled',
          message: `Order #${String(orderId).slice(-8)} was cancelled.`,
          type: 'order',
        })
      );
      refetchTracking();
      refetchOrder();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel order.');
    } finally {
      setShowCancelDialog(false);
    }
  };

  const handleSubmitPromptReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const restId = order?.restaurantId || tracking?.restaurantId;
    if (!restId) {
      toast.error('Unable to determine restaurant for this review.');
      return;
    }
    try {
      await addReview({
        restaurantId: restId,
        orderId,
        rating: promptRating,
        comment: promptComment.trim() || 'Great experience! Delivered promptly.',
        reviewType: 'RESTAURANT',
      }).unwrap();
      toast.success('🎉 Thank you! Your review has been published.');
      setShowReviewPromptModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit review');
    }
  };

  const handleStatusTransition = async (nextStatus: string) => {
    try {
      await updateOrderStatus({ orderId, status: nextStatus }).unwrap();
      toast.success(`Order updated to ${nextStatus.replace(/_/g, ' ')}`);

      if (nextStatus === 'OUT_FOR_DELIVERY') {
        dispatch(
          addNotification({
            title: 'Food Dispatched',
            message: `Order #${String(orderId).slice(-8)} is out for delivery with courier ${user?.name || 'Driver'}.`,
            type: 'order',
          })
        );
      } else if (nextStatus === 'DELIVERED') {
        dispatch(
          addNotification({
            title: 'Order Delivered',
            message: `Order #${String(orderId).slice(-8)} has been successfully DELIVERED.`,
            type: 'order',
          })
        );
      } else {
        dispatch(
          addNotification({
            title: 'Order Status Updated',
            message: `Order #${String(orderId).slice(-8)} updated to ${nextStatus.replace(/_/g, ' ')}.`,
            type: 'order',
          })
        );
      }

      refetchTracking();
      refetchOrder();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update order status');
    }
  };

  const orderObj = order || tracking;
  const isAssignedToThisDriver = isDriver && isDriverAssignedToOrder(orderObj, user);
  const isUnassignedOrder = isDriver && isOrderUnassigned(orderObj);
  const isAssignedToOtherDriver = isDriver && !isUnassignedOrder && !isAssignedToThisDriver;

  const handleClaimOrder = async () => {
    if (driverHasActiveDelivery) {
      toast.error(
        `Cannot accept: You already have active delivery #${String(currentDriverActiveOrder?.orderId || currentDriverActiveOrder?.id).slice(-8)}. Complete it first.`
      );
      return;
    }

    try {
      const driverDisplayName = user?.name || user?.email?.split('@')[0] || 'Courier Driver';
      await assignDriver({
        orderId,
        driverName: driverDisplayName,
        driverPhone: user?.phone || '9876543210',
        driverVehicleNumber: 'MH-01-AB-1234',
      }).unwrap();

      toast.success('🎉 Delivery Accepted! You are now assigned to this order.');
      dispatch(
        addNotification({
          title: 'Courier Accepted Order',
          message: `Courier ${driverDisplayName} accepted Order #${String(orderId).slice(-8)}.`,
          type: 'order',
        })
      );
      refetchTracking();
      refetchOrder();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to accept delivery.');
    }
  };

  const destinationAddress = [
    order?.deliveryAddress || tracking?.deliveryAddress,
    order?.deliveryArea,
    order?.deliveryCity,
    order?.deliveryPincode,
  ]
    .filter(Boolean)
    .join(', ');

  const isLoading = trackingLoading && orderLoading;

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={user?.role} />

          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
            {/* Top Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href={ROUTES.ORDERS}
                  className="p-2 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary-color)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <span className="text-xs font-mono text-[var(--primary-color)] font-bold">
                    Order #{String(orderId || '').slice(-8).toUpperCase()}
                  </span>
                  <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                    {isDelivered
                      ? 'Tracking Ended • Order Delivered'
                      : isCancelled
                      ? 'Tracking Ended • Order Cancelled'
                      : 'Live Order Tracking'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/orders/${orderId}`}
                  className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--background-color)] text-xs font-bold transition-all flex items-center gap-1.5 text-[var(--text-secondary)]"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Invoice & Details</span>
                </Link>

                <button
                  onClick={() => {
                    refetchTracking();
                    refetchOrder();
                  }}
                  className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--background-color)] text-xs font-bold transition-all text-[var(--text-secondary)]"
                  title="Sync Status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {/* Prominent Tracking Ended Banners */}
                {isDelivered && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-outfit font-extrabold text-base text-[var(--text-primary)]">
                          Tracking Ended — Delivery Completed
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Your food was successfully delivered to your doorstep. Live GPS tracking has ended.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {(order?.restaurantId || tracking?.restaurantId) && (
                        <Link
                          href={`${ROUTES.RESTAURANT(order?.restaurantId || tracking?.restaurantId)}?tab=reviews`}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>Rate & Review</span>
                        </Link>
                      )}
                      <Link
                        href={`/orders/${orderId}`}
                        className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 transition-all"
                      >
                        View Receipt
                      </Link>
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-outfit font-extrabold text-base text-[var(--text-primary)]">
                          Tracking Ended — Order Cancelled
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          This order was cancelled. Courier dispatch and active route tracking have concluded.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link
                        href={ROUTES.BROWSE}
                        className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all shadow-md"
                      >
                        Browse Other Restaurants
                      </Link>
                      <Link
                        href={`${ROUTES.SUPPORT}?orderId=${encodeURIComponent(orderId)}`}
                        className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 transition-all"
                      >
                        Support
                      </Link>
                    </div>
                  </div>
                )}

                {/* Header Restaurant & Status Bar */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-outfit font-bold text-base">
                        {order?.restaurantName || tracking?.restaurantName || 'Restaurant Partner'}
                      </h2>
                      <p className="text-xs text-[var(--text-muted)]">
                        Placed on {formatDate(order?.createdAt || tracking?.placedAt || new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={currentStatus} type="order" />

                    {isCancellable && !isTrackingEnded && (
                      <button
                        onClick={handleCancelClick}
                        disabled={isCancelling}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Staff Simulator & Order Status Controls for ADMIN, MANAGER, OWNER */}
                {isStaff && (
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Staff Operations ({role}): Update Order Status</span>
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        Current: <strong>{currentStatus}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
                        (st) => (
                          <button
                            key={st}
                            disabled={isUpdatingStatus || currentStatus === st}
                            onClick={() => handleStatusTransition(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              currentStatus === st
                                ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                                : st === 'DELIVERED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : st === 'CANCELLED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                : 'bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {st === 'DELIVERED' ? 'Mark Delivered' : st === 'CANCELLED' ? 'Cancel Order' : st.replace(/_/g, ' ')}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Courier Operations: ONLY for orders assigned to this driver */}
                {isAssignedToThisDriver && !isTrackingEnded && (
                  <div className="bg-[var(--surface-color)] border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Courier Operations (Assigned to You): Update Delivery</span>
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        Current: <strong>{currentStatus}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(currentStatus) && (
                        <button
                          disabled={isUpdatingStatus}
                          onClick={() => handleStatusTransition('OUT_FOR_DELIVERY')}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-sky-500 hover:bg-sky-600 text-white transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Food Picked Up (Dispatched)</span>
                        </button>
                      )}

                      {currentStatus === 'OUT_FOR_DELIVERY' && (
                        <button
                          disabled={isUpdatingStatus}
                          onClick={() => handleStatusTransition('DELIVERED')}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Order Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Unassigned order view for courier: Can claim/accept */}
                {isUnassignedOrder && !isTrackingEnded && (
                  <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-amber-300">Unassigned Delivery</p>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">
                          {driverHasActiveDelivery
                            ? `You cannot accept this order because you are currently handling active Order #${String(currentDriverActiveOrder?.orderId || currentDriverActiveOrder?.id).slice(-8)}. Complete it first.`
                            : 'This order has not been assigned to a courier by admin yet. You can accept and deliver this order.'}
                        </p>
                      </div>
                    </div>
                    {driverHasActiveDelivery ? (
                      <button
                        disabled
                        title={`Finish Order #${String(currentDriverActiveOrder?.orderId || currentDriverActiveOrder?.id).slice(-8)} before accepting a new delivery.`}
                        className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80 shrink-0"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Busy: Complete Current First</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleClaimOrder}
                        disabled={isAssigning}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{isAssigning ? 'Accepting...' : 'Accept Delivery'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Courier access restricted if assigned to another driver */}
                {isAssignedToOtherDriver && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-rose-300">Restricted Courier Access</p>
                        <p className="text-[11px] text-rose-200/80 mt-0.5">
                          This order is assigned to courier &quot;{tracking?.driverName || order?.driverName || 'Another Driver'}&quot;. You can only modify deliveries assigned to your account.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={ROUTES.DRIVER_ORDERS}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all shrink-0"
                    >
                      My Deliveries
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Timeline & Map */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Status Timeline */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                      <h3 className="font-outfit font-bold text-base mb-6 border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--primary-color)]" />
                        <span>Delivery Status Timeline</span>
                      </h3>

                      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-color)]">
                        {STAGES.map((stage, idx) => {
                          const isDone = isDelivered ? true : !isCancelled && idx <= currentStageIndex;
                          const isCurrent = !isCancelled && idx === currentStageIndex;

                          return (
                            <div key={stage.id} className="relative flex items-start gap-4">
                              <div
                                className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                    : isCurrent
                                    ? 'bg-[var(--primary-color)] text-white shadow-md shadow-[var(--primary-color)]/30'
                                    : 'bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)]'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>

                              <div>
                                <h4
                                  className={`font-outfit font-bold text-sm ${
                                    isDone
                                      ? 'text-emerald-400'
                                      : isCurrent
                                      ? 'text-[var(--primary-color)]'
                                      : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {stage.title}
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{stage.desc}</p>
                              </div>
                            </div>
                          );
                        })}

                        {isCancelled && (
                          <div className="relative flex items-start gap-4">
                            <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-rose-500/30">
                              <X className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-outfit font-bold text-sm text-rose-400">Order Cancelled</h4>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Order was cancelled. Delivery has ceased.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GPS Map Display */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-outfit font-bold text-sm flex items-center gap-2">
                          <Car className="w-4 h-4 text-[var(--primary-color)]" />
                          <span>
                            {isDelivered
                              ? 'GPS Delivery Route (Completed)'
                              : isCancelled
                              ? 'GPS Delivery Route (Inactive)'
                              : 'Live Driver GPS Tracking'}
                          </span>
                        </h3>

                        {isDelivered ? (
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Tracking Concluded
                          </span>
                        ) : isCancelled ? (
                          <span className="text-[11px] text-rose-400 font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            Tracking Terminated
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Active Connection
                          </span>
                        )}
                      </div>

                      <div className="relative h-56 w-full rounded-xl overflow-hidden bg-neutral-900 border border-[var(--border-color)] flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                        <svg className="absolute inset-0 w-full h-full stroke-[var(--primary-color)] stroke-2 fill-none opacity-60">
                          <path d="M 50 180 C 150 40, 300 200, 450 80" strokeDasharray="6,6" />
                        </svg>

                        {/* Center Pin Indicator */}
                        {isDelivered ? (
                          <div className="relative z-10 bg-emerald-500 text-black p-3 rounded-full shadow-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        ) : isCancelled ? (
                          <div className="relative z-10 bg-rose-500 text-white p-3 rounded-full shadow-2xl">
                            <XCircle className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="relative z-10 bg-[var(--primary-color)] text-white p-2.5 rounded-full shadow-xl animate-pulse">
                            <Car className="w-5 h-5" />
                          </div>
                        )}

                        {/* Banner at bottom of map */}
                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                          {isDelivered ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Delivered at Destination
                            </span>
                          ) : isCancelled ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> Delivery Terminated
                            </span>
                          ) : tracking?.estimatedDeliveryTime ? (
                            <>
                              Est. Delivery Time:{' '}
                              <span className="font-bold text-[var(--primary-color)]">
                                {formatDate(tracking.estimatedDeliveryTime)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[var(--text-muted)]">Live courier route active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Driver, Address & Order Items */}
                  <div className="space-y-6">
                    {/* Driver Card */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-outfit font-bold text-xs uppercase text-[var(--text-secondary)] tracking-wider">
                          Assigned Courier
                        </h3>
                        {isAdmin && !isTrackingEnded && (
                          <button
                            onClick={() => setShowReassignModal(true)}
                            className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Reassign Driver</span>
                          </button>
                        )}
                      </div>

                      {tracking?.driverName ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[var(--primary-color)]/20 text-[var(--primary-color)] font-bold text-base flex items-center justify-center border border-[var(--primary-color)]/30">
                              {tracking.driverName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[var(--text-primary)]">{tracking.driverName}</h4>
                              <p className="text-xs text-[var(--text-muted)]">
                                {tracking.driverVehicleNumber || 'Verified Partner'}
                              </p>
                              {isDelivered && (
                                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                  <Check className="w-3 h-3" /> Delivery completed
                                </span>
                              )}
                            </div>
                          </div>

                          {tracking.driverPhone && !isTrackingEnded && (
                            <a
                              href={`tel:${tracking.driverPhone}`}
                              className="w-full py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                            >
                              <Phone className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                              <span>Call {tracking.driverName}</span>
                            </a>
                          )}
                        </>
                      ) : (
                        <div className="p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] space-y-2">
                          <p className="font-semibold text-[var(--text-primary)] mb-0.5">
                            {isCancelled ? 'No Driver Needed' : 'Driver Assignment Pending'}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {isCancelled
                              ? 'Order was cancelled prior to courier dispatch.'
                              : 'A courier will be assigned as soon as the kitchen accepts your order.'}
                          </p>
                          {isAdmin && !isTrackingEnded && (
                            <button
                              onClick={() => setShowReassignModal(true)}
                              className="w-full py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 mt-2"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Assign Driver Now</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Destination Address */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl space-y-2">
                      <h3 className="font-outfit font-bold text-xs uppercase text-[var(--text-secondary)] tracking-wider">
                        Delivery Destination
                      </h3>
                      <div className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                        <MapPin className="w-4 h-4 text-[var(--primary-color)] shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">
                          {destinationAddress || 'Address on record'}
                        </span>
                      </div>
                    </div>

                    {/* Order Details Breakdown */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl space-y-4">
                      <h3 className="font-outfit font-bold text-sm border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[var(--primary-color)]" />
                        <span>Order Items ({items.length})</span>
                      </h3>

                      {items.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {items.map((it: any, i: number) => (
                            <div key={it.orderItemId || it.itemId || i} className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-semibold text-[var(--text-primary)]">{it.itemName || it.name}</span>
                                <span className="text-[var(--text-muted)] ml-1.5">×{it.quantity}</span>
                              </div>
                              <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                                {formatCurrency(it.itemTotal || (it.price * it.quantity) || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)]">Items data loaded from database.</p>
                      )}

                      <div className="border-t border-[var(--border-color)] pt-3 text-xs space-y-1.5">
                        <div className="flex justify-between text-[var(--text-secondary)]">
                          <span>Payment Method</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {order?.paymentMethod || tracking?.paymentMethod || 'CARD'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[var(--text-secondary)]">
                          <span>Payment Status</span>
                          <StatusBadge status={order?.paymentStatus || (isDelivered ? 'PAID' : isCancelled ? 'REFUNDED' : 'PENDING')} type="payment" />
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-[var(--text-primary)] border-t border-[var(--border-color)] pt-2 mt-2">
                          <span>Total Amount</span>
                          <span className="text-[var(--primary-color)]">
                            {formatCurrency(order?.totalAmount || order?.subtotal || tracking?.totalAmount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isDelivered && (order?.restaurantId || tracking?.restaurantId) && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-center space-y-3 shadow-md">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <h4 className="font-outfit font-bold text-sm text-[var(--text-primary)]">
                            How was your meal?
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Help fellow foodies by sharing your feedback for {order?.restaurantName || tracking?.restaurantName || 'this restaurant'}.
                          </p>
                        </div>
                        <Link
                          href={`${ROUTES.RESTAURANT(order?.restaurantId || tracking?.restaurantId)}?tab=reviews`}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>Write a Review & Rate</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>

        {/* Modal: Reassign Driver for Admin */}
        {showReassignModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <span>Reassign Courier (Order #{String(orderId).slice(-8)})</span>
                </h3>
                <button onClick={() => setShowReassignModal(false)} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!driverName.trim()) {
                    toast.error('Please choose an available driver');
                    return;
                  }

                  const rawOrders = allOrdersRes?.data?.content || allOrdersRes?.data || allOrdersRes || [];
                  const ordersArr = Array.isArray(rawOrders) ? rawOrders : [];
                  const busyOrder = ordersArr.find(
                    (o: any) =>
                      (o.driverName === driverName || o.driverPhone === driverPhone || o.driverId === selectedDriverId) &&
                      (o.orderId || o.id) !== orderId &&
                      !['DELIVERED', 'CANCELLED'].includes(o.status)
                  );
                  if (busyOrder) {
                    toast.error(
                      `Target driver "${driverName}" is currently busy with Order #${String(busyOrder.id || busyOrder.orderId).slice(-8)}. Drivers can only handle 1 active order at a time.`
                    );
                    return;
                  }

                  try {
                    await assignDriver({
                      orderId,
                      driverName: driverName.trim(),
                      driverPhone: driverPhone.trim(),
                      driverVehicleNumber: vehicleNumber.trim(),
                    }).unwrap();

                    toast.success(`Driver "${driverName}" reassigned successfully!`);
                    dispatch(
                      addNotification({
                        title: 'Order Reassigned by Admin',
                        message: `Order #${String(orderId).slice(-8)} was reassigned to courier ${driverName}.`,
                        type: 'order',
                      })
                    );
                    setShowReassignModal(false);
                    refetchTracking();
                    refetchOrder();
                  } catch (err: any) {
                    toast.error(err?.data?.message || 'Failed to reassign driver');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Select Driver from User DB (role == DELIVERY_DRIVER) *
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDriverId(id);
                      const allUsers = usersRes?.data?.content || usersRes?.data || usersRes || [];
                      const chosen = Array.isArray(allUsers) ? allUsers.find((u: any) => (u.id || u.userId) === id) : null;
                      if (chosen) {
                        setDriverName(chosen.name || '');
                        setDriverPhone(chosen.phone || '9876543210');
                      }
                    }}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Select available driver --</option>
                    {(() => {
                      const rawUsers = usersRes?.data?.content || usersRes?.data || usersRes || [];
                      const usersArr = Array.isArray(rawUsers) ? rawUsers : [];
                      const drivers = usersArr.filter((u: any) => u.role === 'DELIVERY_DRIVER');

                      const rawOrders = allOrdersRes?.data?.content || allOrdersRes?.data || allOrdersRes || [];
                      const ordersArr = Array.isArray(rawOrders) ? rawOrders : [];

                      return drivers.map((d: any) => {
                        const busyOrder = ordersArr.find(
                          (o: any) =>
                            (o.driverName === d.name || o.driverPhone === d.phone || o.driverId === d.id) &&
                            (o.orderId || o.id) !== orderId &&
                            !['DELIVERED', 'CANCELLED'].includes(o.status)
                        );
                        const isBusy = !!busyOrder;
                        return (
                          <option key={d.id || d.userId} value={d.id || d.userId} disabled={isBusy}>
                            {d.name || 'Courier'} ({d.email}) {isBusy ? `— ⚠️ UNAVAILABLE (Order #${String(busyOrder.id || busyOrder.orderId).slice(-8)})` : '— ✅ AVAILABLE'}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Driver Name *</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Driver Phone *</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Vehicle License Plate *</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReassignModal(false)}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60"
                  >
                    {isAssigning ? 'Reassigning...' : 'Save Reassigned Driver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Auto Review Prompt on Delivery */}
        {showReviewPromptModal && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-prompt-title"
          >
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 id="review-prompt-title" className="font-outfit font-bold text-base text-[var(--text-primary)]">
                      Rate Your Meal & Delivery
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {order?.restaurantName || tracking?.restaurantName || 'Order Completed'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewPromptModal(false)}
                  aria-label="Close review dialog"
                  className="p-1 text-[var(--text-muted)] hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitPromptReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                    How was the food and service?
                  </label>
                  <div className="flex items-center justify-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPromptRating(star)}
                        className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= promptRating
                              ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                              : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs font-semibold text-amber-400 mt-1">
                    {promptRating === 5
                      ? '⭐⭐⭐⭐⭐ Exceptional!'
                      : promptRating === 4
                      ? '⭐⭐⭐⭐ Great!'
                      : promptRating === 3
                      ? '⭐⭐⭐ Good'
                      : promptRating === 2
                      ? '⭐⭐ Fair'
                      : '⭐ Poor'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Your Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={promptComment}
                    onChange={(e) => setPromptComment(e.target.value)}
                    placeholder="Tell us what you loved or how we can improve..."
                    className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewPromptModal(false)}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-5 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingReview && <LoadingSpinner size="sm" />}
                    <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Cancel */}
        <ConfirmDialog
          isOpen={showCancelDialog}
          title="Cancel Order"
          message="Are you sure you want to cancel this order? This action cannot be undone."
          confirmLabel="Cancel Order"
          cancelLabel="Keep Order"
          variant="danger"
          isLoading={isCancelling}
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelDialog(false)}
        />
      </div>
    </AuthGuard>
  );
}
