'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';
import { useGetDriverOrdersQuery, useUpdateOrderStatusMutation, useAssignDriverMutation } from '@/store/api/orderApi';
import { Truck, Package, MapPin, CheckCircle2, BellRing, ArrowRight, RefreshCw, Check, Navigation, UserCheck, AlertTriangle, Lock } from 'lucide-react';
import { formatCurrency, formatDate, isDriverAssignedToOrder, isOrderUnassigned } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';

export default function DriverDeliveriesPage() {
  const dispatch = useDispatch();
  const { user } = useAppSelector(s => s.auth);
  const [activeTab, setActiveTab] = useState<'MY_ACTIVE' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'UNASSIGNED'>('MY_ACTIVE');

  const { data: driverOrdersRes, isLoading, refetch } = useGetDriverOrdersQuery(
    { page: 0, size: 100 },
    { pollingInterval: 3000 }
  );

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [assignDriver, { isLoading: isClaiming }] = useAssignDriverMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const orders: any[] = extractArray(driverOrdersRes);

  // 1. Orders assigned to this driver:
  const myAssignedOrders = orders.filter((o) => isDriverAssignedToOrder(o, user));
  const myActiveOrders = myAssignedOrders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const readyOrders = myAssignedOrders.filter((o) => ['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'DRIVER_ASSIGNED'].includes(o.status));
  const outForDeliveryOrders = myAssignedOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY');
  const completedOrders = myAssignedOrders.filter((o) => o.status === 'DELIVERED');

  // Single active delivery limit enforcement
  const hasActiveDelivery = myActiveOrders.length > 0;
  const currentActiveOrder = myActiveOrders[0];

  // 2. Orders NOT assigned by admin to anyone yet (unassigned waiting for a courier):
  const unassignedOrders = orders.filter((o) => isOrderUnassigned(o) && !['DELIVERED', 'CANCELLED'].includes(o.status));

  // Notice: Orders assigned to OTHER drivers (!isOrderUnassigned && !isDriverAssigned) are strictly excluded!

  // Filter based on active tab selection
  const displayedOrders = (() => {
    if (activeTab === 'READY_FOR_PICKUP') return readyOrders;
    if (activeTab === 'OUT_FOR_DELIVERY') return outForDeliveryOrders;
    if (activeTab === 'DELIVERED') return completedOrders;
    if (activeTab === 'UNASSIGNED') return unassignedOrders;
    return myActiveOrders;
  })();

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus }).unwrap();

      if (newStatus === 'OUT_FOR_DELIVERY') {
        toast.success('🚀 Food Picked Up! Order status updated to OUT FOR DELIVERY.');
        dispatch(
          addNotification({
            title: 'Food Dispatched',
            message: `Order #${String(orderId).slice(-8)} picked up by courier ${user?.name || 'Driver'} and is now out for delivery.`,
            type: 'order',
          })
        );
      } else if (newStatus === 'DELIVERED') {
        toast.success('🎉 Order successfully DELIVERED to customer!');
        dispatch(
          addNotification({
            title: 'Order Delivered',
            message: `Order #${String(orderId).slice(-8)} was marked DELIVERED by courier ${user?.name || 'Driver'}.`,
            type: 'order',
          })
        );
      } else {
        toast.success(`Delivery status updated to ${newStatus.replace(/_/g, ' ')}`);
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update delivery status');
    }
  };

  const handleClaimOrder = async (orderId: string) => {
    if (hasActiveDelivery) {
      toast.error(
        `Cannot accept: You already have active delivery #${String(currentActiveOrder.orderId || currentActiveOrder.id).slice(-8)}. Complete it first.`
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

      toast.success('🎉 Delivery Accepted! You are now assigned to deliver this order.');
      dispatch(
        addNotification({
          title: 'Courier Accepted Order',
          message: `Courier ${driverDisplayName} accepted and is assigned to Order #${String(orderId).slice(-8)}`,
          type: 'order',
        })
      );
      setActiveTab('MY_ACTIVE');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to accept delivery.');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Synced delivery routes with server');
  };

  return (
    <div className="space-y-6">
      {/* Active Delivery Alert Banner (Enforcing single-active-delivery constraint) */}
      {hasActiveDelivery && currentActiveOrder && (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-300">
                🔒 ACTIVE DELIVERY IN PROGRESS: #{String(currentActiveOrder.orderId || currentActiveOrder.id).slice(-8).toUpperCase()} ({currentActiveOrder.status?.replace(/_/g, ' ')})
              </p>
              <p className="mt-0.5 text-amber-200/80">
                You must mark this order as <strong>DELIVERED</strong> before accepting or being assigned to another delivery.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('MY_ACTIVE')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-all shadow-md"
          >
            <span>View Active Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Notification Banner when food is ready for pickup */}
      {readyOrders.length > 0 && (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <BellRing className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-300">
                ⚡ ALERT: {readyOrders.length} Order(s) Waiting for Courier Pickup!
              </p>
              <p className="mt-0.5 text-amber-200/80">
                Click &quot;Food Picked Up (Dispatched)&quot; below to transition order status to OUT FOR DELIVERY.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-amber-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1 shrink-0 hover:bg-amber-400 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
        </div>
      )}

      {/* Unassigned Orders Alert Banner */}
      {unassignedOrders.length > 0 && activeTab !== 'UNASSIGNED' && (
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sky-400">
            <Package className="w-4 h-4 shrink-0" />
            <span>
              <strong>{unassignedOrders.length} order(s)</strong> have not been assigned by admin yet. {hasActiveDelivery ? 'You cannot claim new orders while you have an active delivery.' : 'You can claim available deliveries.'}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('UNASSIGNED')}
            className="px-3 py-1 bg-sky-500 text-white font-bold text-xs rounded-lg hover:bg-sky-600 transition-all shrink-0"
          >
            View Available ({unassignedOrders.length})
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold tracking-tight">Courier Deliveries</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Logged in Courier: <strong className="text-emerald-400">{user?.name || 'Delivery Driver'}</strong> ({user?.email})
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-emerald-500 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Refresh Live Routes</span>
        </button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('MY_ACTIVE')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'MY_ACTIVE'
              ? 'bg-[var(--primary-color)]/10 border-[var(--primary-color)] shadow-md'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] hover:border-[var(--primary-color)]/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-[var(--primary-color)]" />
            <span className="text-xs font-bold text-[var(--text-muted)]">My Active</span>
          </div>
          <span className="font-outfit text-2xl font-extrabold text-[var(--primary-color)]">{myActiveOrders.length}</span>
        </div>

        <div
          onClick={() => setActiveTab('READY_FOR_PICKUP')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'READY_FOR_PICKUP'
              ? 'bg-amber-500/15 border-amber-500 shadow-md'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-[var(--text-muted)]">Awaiting Pickup</span>
          </div>
          <span className="font-outfit text-2xl font-extrabold text-amber-400">{readyOrders.length}</span>
        </div>

        <div
          onClick={() => setActiveTab('OUT_FOR_DELIVERY')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'OUT_FOR_DELIVERY'
              ? 'bg-sky-500/15 border-sky-500 shadow-md'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-[var(--text-muted)]">On The Road</span>
          </div>
          <span className="font-outfit text-2xl font-extrabold text-sky-400">{outForDeliveryOrders.length}</span>
        </div>

        <div
          onClick={() => setActiveTab('DELIVERED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'DELIVERED'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-md'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-[var(--text-muted)]">Completed</span>
          </div>
          <span className="font-outfit text-2xl font-extrabold text-emerald-400">{completedOrders.length}</span>
        </div>

        <div
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all col-span-2 sm:col-span-1 ${
            activeTab === 'UNASSIGNED'
              ? 'bg-purple-500/15 border-purple-500 shadow-md'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-[var(--text-muted)]">Unassigned</span>
          </div>
          <span className="font-outfit text-2xl font-extrabold text-purple-400">{unassignedOrders.length}</span>
        </div>
      </div>

      {/* Status Filter Tabs Bar */}
      <div className="flex items-center gap-2 bg-[var(--surface-color)] border border-[var(--border-color)] p-1.5 rounded-2xl overflow-x-auto">
        {[
          { id: 'MY_ACTIVE', label: `My Active (${myActiveOrders.length})` },
          { id: 'READY_FOR_PICKUP', label: `⚡ Ready for Pickup (${readyOrders.length})` },
          { id: 'OUT_FOR_DELIVERY', label: `🚀 Out for Delivery (${outForDeliveryOrders.length})` },
          { id: 'DELIVERED', label: `✅ Completed (${completedOrders.length})` },
          { id: 'UNASSIGNED', label: `📦 Available / Unassigned (${unassignedOrders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--primary-color)] text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-color)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {displayedOrders.length > 0 ? (
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-outfit font-bold text-base">
                {activeTab === 'OUT_FOR_DELIVERY'
                  ? '🚀 Deliveries Out On The Road'
                  : activeTab === 'READY_FOR_PICKUP'
                  ? '⚡ Orders Waiting For Pickup'
                  : activeTab === 'DELIVERED'
                  ? '✅ Completed Deliveries'
                  : activeTab === 'UNASSIGNED'
                  ? '📦 Available Deliveries (Not Assigned by Admin)'
                  : 'Your Assigned Deliveries'}
              </h3>
            </div>
            <span className="text-xs font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2.5 py-1 rounded-full">
              {displayedOrders.length} Order(s)
            </span>
          </div>

          <div className="divide-y divide-[var(--border-color)]">
            {displayedOrders.map((order) => {
              const id = order.orderId || order.id;
              const items: any[] = order.items || [];
              const isAssignedToMe = isDriverAssignedToOrder(order, user);
              const isUnassigned = isOrderUnassigned(order);
              const isReady = ['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'PLACED', 'DRIVER_ASSIGNED'].includes(order.status);
              const isOut = order.status === 'OUT_FOR_DELIVERY';
              const isDelivered = order.status === 'DELIVERED';

              return (
                <div key={id} className="p-5 hover:bg-[var(--background-color)]/60 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                          #{String(id).slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} type="order" />
                        {isUnassigned && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            ⚡ Awaiting Courier (Unassigned)
                          </span>
                        )}
                        {isAssignedToMe && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Assigned to You
                          </span>
                        )}
                        {isOut && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-sky-500 text-white shadow-xs">
                            🚀 OUT FOR DELIVERY
                          </span>
                        )}
                        {isDelivered && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500 text-white shadow-xs">
                            ✅ DELIVERED
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-extrabold text-[var(--text-primary)]">
                        Restaurant: {order.restaurantName || 'Restaurant Partner'}
                      </p>

                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--text-secondary)] font-semibold">
                          Dropoff Address: {[order.deliveryAddress, order.deliveryArea, order.deliveryCity].filter(Boolean).join(', ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                        <span>Items: <strong className="text-[var(--text-primary)]">{items.map((i: any) => `${i.itemName || i.name} (x${i.quantity})`).join(', ') || 'Food Item(s)'}</strong></span>
                        <span>Total: <strong className="text-[var(--primary-color)]">{formatCurrency(order.totalAmount || order.subtotal || 0)}</strong></span>
                        <span>Payment: <strong className="text-emerald-400">{order.paymentStatus || 'PAID'}</strong></span>
                      </div>
                    </div>

                    {/* Action Buttons: Only for assigned orders or claiming unassigned orders */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      {isUnassigned && (
                        hasActiveDelivery ? (
                          <button
                            disabled
                            title={`You are already busy with Order #${String(currentActiveOrder.orderId || currentActiveOrder.id).slice(-8)}. Complete it before accepting another delivery.`}
                            className="px-4 py-2.5 bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-80"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Busy: Complete Current First</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClaimOrder(id)}
                            disabled={isClaiming}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>{isClaiming ? 'Accepting...' : 'Accept Delivery'}</span>
                          </button>
                        )
                      )}

                      {isAssignedToMe && isReady && !isOut && !isDelivered && (
                        <button
                          onClick={() => handleStatusUpdate(id, 'OUT_FOR_DELIVERY')}
                          disabled={isUpdating}
                          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Food Picked Up (Dispatched)</span>
                        </button>
                      )}

                      {isAssignedToMe && isOut && (
                        <button
                          onClick={() => handleStatusUpdate(id, 'DELIVERED')}
                          disabled={isUpdating}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Order Delivered</span>
                        </button>
                      )}

                      {isAssignedToMe && isDelivered && (
                        <span className="px-3.5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Delivered
                        </span>
                      )}

                      <Link
                        href={ROUTES.TRACKING(id)}
                        className="px-3.5 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Live Tracker</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--surface-color)] border border-dashed border-[var(--border-color)] rounded-3xl space-y-3">
          <Truck className="w-14 h-14 text-[var(--text-muted)] mx-auto mb-2" />
          <h3 className="font-outfit font-bold text-xl">No Deliveries in Selected Tab</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {activeTab === 'OUT_FOR_DELIVERY'
              ? 'No orders are currently out on the road. Click "Food Picked Up" on an assigned order to dispatch it.'
              : activeTab === 'READY_FOR_PICKUP'
              ? 'No assigned orders waiting for pickup at the moment.'
              : activeTab === 'DELIVERED'
              ? 'No completed deliveries logged yet.'
              : activeTab === 'UNASSIGNED'
              ? 'No unassigned orders waiting for a courier right now. All orders have been assigned by admin.'
              : 'You have no active deliveries assigned to your account. Check the "Unassigned" tab to claim available orders.'}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            Refresh Orders List
          </button>
        </div>
      )}
    </div>
  );
}
