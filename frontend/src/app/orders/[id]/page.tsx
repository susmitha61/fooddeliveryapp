'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppSelector } from '@/store';
import { addItem, clearCart } from '@/store/slices/cartSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import {
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useTrackOrderQuery,
  useUpdateOrderStatusMutation,
  useAssignDriverMutation,
  useGetDriverOrdersQuery,
} from '@/store/api/orderApi';
import { useMarkCodPaidMutation, useProcessRefundMutation } from '@/store/api/paymentApi';
import { formatCurrency, formatDate, isDriverAssignedToOrder, isOrderUnassigned } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Wallet,
  XCircle,
  RotateCcw,
  Receipt,
  FileText,
  UserCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
  const dispatch = useDispatch();
  const params = useParams();
  const router = useRouter();
  const orderId = String(params?.id || '');

  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role || 'CUSTOMER';

  const {
    data: orderRes,
    isLoading: orderLoading,
    error: orderError,
    refetch,
  } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
    pollingInterval: 5000,
  });

  const { data: trackingRes } = useTrackOrderQuery(orderId, {
    skip: !orderId,
  });

  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [markCodPaid, { isLoading: isMarkingCod }] = useMarkCodPaidMutation();
  const [processRefund, { isLoading: isRefunding }] = useProcessRefundMutation();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [assignDriver, { isLoading: isAssigningDriver }] = useAssignDriverMutation();

  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  const orderData = orderRes?.data || null;
  const tracking = trackingRes?.data || null;

  const isDriver = role === 'DELIVERY_DRIVER';
  const isAssignedToThisDriver = isDriver && isDriverAssignedToOrder(orderData, user);
  const isUnassignedOrder = isDriver && isOrderUnassigned(orderData);
  const isAssignedToOtherDriver = isDriver && !isUnassignedOrder && !isAssignedToThisDriver;

  const { data: driverOrdersRes } = useGetDriverOrdersQuery(
    { page: 0, size: 50 },
    { skip: !isDriver, pollingInterval: 3000 }
  );

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

  const handleDriverStatusUpdate = async (nextStatus: string) => {
    try {
      await updateOrderStatus({ orderId, status: nextStatus }).unwrap();
      toast.success(`Delivery status updated to ${nextStatus.replace(/_/g, ' ')}`);

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
            message: `Order #${String(orderId).slice(-8)} was marked DELIVERED by courier ${user?.name || 'Driver'}.`,
            type: 'order',
          })
        );
      } else {
        dispatch(
          addNotification({
            title: 'Delivery Status Updated',
            message: `Order #${String(orderId).slice(-8)} status updated to ${nextStatus.replace(/_/g, ' ')}.`,
            type: 'order',
          })
        );
      }

      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update delivery status.');
    }
  };

  const handleAcceptDelivery = async () => {
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
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to accept delivery.');
    }
  };

  // Determine back route depending on user role
  const getBackRoute = () => {
    switch (role) {
      case 'ADMIN':
        return ROUTES.ADMIN_ORDERS;
      case 'RESTAURANT_OWNER':
        return ROUTES.OWNER_ORDERS;
      case 'MANAGER':
        return ROUTES.MANAGER_ORDERS;
      case 'DELIVERY_DRIVER':
        return ROUTES.DRIVER_ORDERS;
      default:
        return ROUTES.ORDERS;
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder({ orderId, reason: 'Customer requested cancellation' }).unwrap();
      toast.success('Order cancelled successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleMarkCodPaid = async () => {
    try {
      await markCodPaid(orderId).unwrap();
      toast.success('COD order marked as paid.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update payment status.');
    }
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await processRefund({ orderId, reason: refundReason || 'Order adjustment refund' }).unwrap();
      toast.success('Refund processed successfully.');
      setShowRefundModal(false);
      setRefundReason('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to process refund.');
    }
  };

  const items = orderData?.items || orderData?.orderItems || [];
  const grossTotal = Number(orderData?.totalAmount || orderData?.subtotal || 0);
  const subtotal = Number(orderData?.subtotal || (grossTotal - Number(orderData?.deliveryFee || 0)));
  const deliveryFee = Number(orderData?.deliveryFee || 0);
  const paymentMethod = orderData?.paymentMethod || 'CARD';
  const paymentStatus = orderData?.paymentStatus || (
    orderData?.status === 'CANCELLED'
      ? 'REFUNDED'
      : paymentMethod === 'CASH_ON_DELIVERY' && orderData?.status !== 'DELIVERED'
        ? 'PENDING'
        : 'PAID'
  );
  const orderStatus = orderData?.status || 'PLACED';
  const isCancellable = ['PLACED', 'PENDING'].includes(orderStatus);

  const driver = tracking?.driverName
    ? {
        name: tracking.driverName,
        phone: tracking.driverPhone || '9876543210',
        vehicle: tracking.driverVehicleNumber || 'MH-01-AB-1234',
      }
    : null;

  const handleRepeatOrder = () => {
    if (!orderData || !items.length) return;
    dispatch(clearCart());
    items.forEach((item: any) => {
      dispatch(addItem({
        restaurantId: orderData.restaurantId,
        restaurantName: orderData.restaurantName || 'Restaurant',
        item: {
          menuItemId: item.menuItemId || item.id,
          name: item.itemName || item.name || 'Menu Item',
          price: Number(item.price || item.unitPrice || 0),
          quantity: Number(item.quantity || 1),
          imageUrl: item.imageUrl,
        },
      }));
    });
    toast.success('Items added to cart! Redirecting to checkout...');
    router.push('/checkout');
  };

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'MANAGER', 'DELIVERY_DRIVER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={role} />

          {orderLoading ? (
            <main className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-xs text-[var(--text-secondary)] font-medium">Fetching order details #{orderId.slice(-8)}...</p>
              </div>
            </main>
          ) : orderError || !orderData ? (
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
              <Link
                href={getBackRoute()}
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Orders</span>
              </Link>

              <div className="py-16 text-center border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)] p-8">
                <EmptyState
                  icon={Receipt}
                  title="Order Not Found"
                  description={`We could not locate an order matching ID "${orderId}". It may have expired, been removed, or belong to another account.`}
                />
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href={getBackRoute()}
                    className="px-5 py-2.5 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md"
                  >
                    View All Orders
                  </Link>
                  <button
                    onClick={() => refetch()}
                    className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold hover:bg-[var(--background-color)] transition-all"
                  >
                    Retry Lookup
                  </button>
                </div>
              </div>
            </main>
          ) : isAssignedToOtherDriver ? (
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
                <ShieldAlert className="w-14 h-14 text-rose-400 mx-auto" />
                <h2 className="font-outfit text-2xl font-extrabold text-rose-300">
                  Restricted Courier Access
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                  Order #{orderId.slice(-8).toUpperCase()} is assigned to courier &quot;{orderData.driverName || 'Another Courier'}&quot;. Delivery drivers may only view details and manage orders assigned to their own account.
                </p>
                <div className="pt-2">
                  <Link
                    href={ROUTES.DRIVER_ORDERS}
                    className="px-6 py-3 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to My Deliveries</span>
                  </Link>
                </div>
              </div>
            </main>
          ) : (
            <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
              {/* Top Navigation & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Link
                    href={getBackRoute()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Orders</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Order #{orderId.slice(-8).toUpperCase()}
                    </h1>
                    <StatusBadge status={orderStatus} type="order" />
                    <StatusBadge status={paymentStatus} type="payment" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    Placed on {formatDate(orderData.createdAt || new Date().toISOString())} • ID: {orderId}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--background-color)] text-xs font-bold transition-all flex items-center gap-1.5 text-[var(--text-secondary)]"
                    title="Print Invoice / Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>

                  <Link
                    href={ROUTES.TRACKING(orderId)}
                    className="px-4 py-2 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-md shadow-[var(--primary-color)]/20"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Live Tracking</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  {orderStatus === 'DELIVERED' && (
                    <button
                      onClick={handleRepeatOrder}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                      title="Order again with same items"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repeat Order</span>
                    </button>
                  )}

                  <Link
                    href={`${ROUTES.SUPPORT}?orderId=${encodeURIComponent(orderId)}`}
                    className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--background-color)] text-xs font-bold transition-all flex items-center gap-1.5 text-[var(--text-secondary)]"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Support</span>
                  </Link>

                {/* Role Specific Actions */}
                {['ADMIN', 'RESTAURANT_OWNER', 'MANAGER'].includes(role) && paymentMethod === 'CASH_ON_DELIVERY' && paymentStatus === 'PENDING' && (
                  <button
                    onClick={handleMarkCodPaid}
                    disabled={isMarkingCod}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isMarkingCod ? 'Updating...' : 'Mark COD Paid'}</span>
                  </button>
                )}

                {['ADMIN', 'RESTAURANT_OWNER'].includes(role) && paymentStatus === 'PAID' && paymentMethod !== 'CASH_ON_DELIVERY' && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Issue Refund</span>
                  </button>
                )}

                {isCancellable && role === 'CUSTOMER' && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
                  </button>
                )}

                {/* Driver Actions: only if assigned to this driver */}
                {isAssignedToThisDriver && ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(orderStatus) && (
                  <button
                    onClick={() => handleDriverStatusUpdate('OUT_FOR_DELIVERY')}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Food Picked Up (Dispatched)</span>
                  </button>
                )}

                {isAssignedToThisDriver && orderStatus === 'OUT_FOR_DELIVERY' && (
                  <button
                    onClick={() => handleDriverStatusUpdate('DELIVERED')}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Order Delivered</span>
                  </button>
                )}

                {/* Driver Unassigned Order Action: Accept Delivery */}
                {isUnassignedOrder && !['DELIVERED', 'CANCELLED'].includes(orderStatus) && (
                  driverHasActiveDelivery ? (
                    <button
                      disabled
                      title={`Finish active Order #${String(currentDriverActiveOrder?.orderId || currentDriverActiveOrder?.id).slice(-8)} before accepting a new delivery.`}
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Busy: Complete Current First</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAcceptDelivery}
                      disabled={isAssigningDriver}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isAssigningDriver ? 'Accepting...' : 'Accept Delivery'}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Courier Unassigned Alert Banner */}
            {isUnassignedOrder && !['DELIVERED', 'CANCELLED'].includes(orderStatus) && (
              <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-sm text-amber-300">Unassigned Delivery</h3>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      {driverHasActiveDelivery
                        ? `You cannot accept this order because you are currently delivering #${String(currentDriverActiveOrder?.orderId || currentDriverActiveOrder?.id).slice(-8)}. Complete it first.`
                        : 'This order has not been assigned to a courier by admin yet. You can accept and deliver this order.'}
                    </p>
                  </div>
                </div>
                {driverHasActiveDelivery ? (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80 shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Busy: Complete Current First</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAcceptDelivery}
                    disabled={isAssigningDriver}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isAssigningDriver ? 'Accepting...' : 'Accept Delivery'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Items Ordered Card */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
                    <h2 className="font-outfit font-bold text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--primary-color)]" />
                      <span>Order Items ({items.length})</span>
                    </h2>
                    <span className="text-xs text-[var(--text-muted)] font-mono font-medium">
                      Subtotal: {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-[var(--text-secondary)] italic py-4">No detailed items recorded for this order.</p>
                  ) : (
                    <div className="divide-y divide-[var(--border-color)]/60">
                      {items.map((it: any, idx: number) => {
                        const itemPrice = Number(it.price || it.itemPrice || 0);
                        const itemQty = Number(it.quantity || 1);
                        const itemTotal = Number(it.itemTotal || (itemPrice * itemQty));

                        return (
                          <div key={it.orderItemId || it.itemId || idx} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                                    it.isVegetarian
                                      ? 'border-emerald-500 text-emerald-500'
                                      : 'border-rose-500 text-rose-500'
                                  }`}
                                  title={it.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${it.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                </span>
                                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                                  {it.itemName || it.name || 'Menu Item'}
                                </h3>
                              </div>
                              <p className="text-xs text-[var(--text-muted)] font-mono pl-5.5">
                                {formatCurrency(itemPrice)} × {itemQty}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                                {formatCurrency(itemTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Delivery & Restaurant Details Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Restaurant Partner */}
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <Store className="w-4 h-4 text-[var(--primary-color)]" />
                      <span>Prepared By</span>
                    </div>
                    <div>
                      <h3 className="font-outfit font-extrabold text-base text-[var(--text-primary)]">
                        {orderData.restaurantName || 'Restaurant Partner'}
                      </h3>
                      {orderData.restaurantId && (
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          ID: {orderData.restaurantId}
                        </p>
                      )}
                    </div>
                    {orderData.restaurantId && (
                      <Link
                        href={ROUTES.RESTAURANT(orderData.restaurantId)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-color)] hover:underline pt-1"
                      >
                        <span>View Restaurant Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* Delivery Location */}
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-[var(--primary-color)]" />
                      <span>Delivery Address</span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-1">
                      <p className="font-bold text-[var(--text-primary)]">
                        {orderData.userName || user?.name || 'Valued Customer'}
                      </p>
                      <p className="leading-relaxed">
                        {[
                          orderData.deliveryAddress,
                          orderData.deliveryArea,
                          orderData.deliveryCity,
                          orderData.deliveryPincode,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Address not provided'}
                      </p>
                      {orderData.specialInstructions && (
                        <div className="p-2.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] mt-2">
                          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Note to courier:</p>
                          <p className="text-xs text-[var(--text-primary)] italic">"{orderData.specialInstructions}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Driver Details Card (if assigned) */}
                {driver && (
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Assigned Courier</span>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{driver.name}</h4>
                        <p className="text-xs text-[var(--text-secondary)] font-mono">{driver.vehicle}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${driver.phone}`}
                      className="px-3.5 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--background-color)] text-xs font-bold text-[var(--primary-color)] transition-colors"
                    >
                      Call Driver
                    </a>
                  </div>
                )}
              </div>

              {/* Sidebar Summary (1 col) */}
              <div className="space-y-6">
                {/* Financial Breakdown */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                  <h2 className="font-outfit font-bold text-base flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
                    <Receipt className="w-4 h-4 text-[var(--primary-color)]" />
                    <span>Payment Summary</span>
                  </h2>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Items Subtotal</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Delivery Fee</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">
                        {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'FREE'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Platform & Taxes</span>
                      <span className="font-mono font-medium text-emerald-400">Included</span>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-baseline">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Grand Total</span>
                      <span className="font-outfit font-extrabold text-xl text-[var(--primary-color)]">
                        {formatCurrency(grossTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Details Box */}
                  <div className="p-3.5 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-medium">Payment Mode</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[var(--text-primary)]">
                        {paymentMethod === 'CARD' && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                        {paymentMethod === 'UPI' && <Wallet className="w-3.5 h-3.5 text-emerald-400" />}
                        {paymentMethod === 'CASH_ON_DELIVERY' && <DollarSign className="w-3.5 h-3.5 text-amber-400" />}
                        {paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-medium">Payment Status</span>
                      <StatusBadge status={paymentStatus} type="payment" />
                    </div>

                    {orderData.paymentId && (
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]/60 text-[11px] font-mono">
                        <span className="text-[var(--text-muted)]">Txn ID</span>
                        <span className="text-[var(--text-secondary)]">#{orderData.paymentId.slice(-8)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Need Help Card */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[var(--primary-color)]" />
                    <h3 className="font-outfit font-bold text-sm">Need help with this order?</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Have an issue with missing items, late delivery, or refund inquiry? Open a direct support ticket.
                  </p>
                  <Link
                    href={`${ROUTES.SUPPORT}?orderId=${encodeURIComponent(orderId)}`}
                    className="w-full py-2 px-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--background-color)] text-xs font-bold text-center block transition-colors text-[var(--primary-color)]"
                  >
                    Open Support Ticket
                  </Link>
                </div>
              </div>
            </div>
          </main>
        )}
        </div>

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-400" />
                  <span>Issue Order Refund</span>
                </h3>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                You are about to issue a refund of <strong className="text-[var(--text-primary)]">{formatCurrency(grossTotal)}</strong> for Order #{orderId.slice(-8)}.
              </p>

              <form onSubmit={handleIssueRefund} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                    Refund Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Customer cancelled order / Out of stock item"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold hover:bg-[var(--background-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRefunding}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 shadow-md disabled:opacity-50"
                  >
                    {isRefunding ? 'Processing...' : 'Confirm Refund'}
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
