'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { addNotification } from '@/store/slices/notificationSlice';
import {
  ClipboardList, Clock, MapPin, User, Truck, ArrowRight,
  Phone, Car, X, RefreshCw, Eye, XCircle, Search, Store,
  CheckCircle2, CreditCard, ExternalLink, ShieldCheck, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';


export const NEXT_STATUS: Record<string, { label: string; value: string; color: string }> = {
  PLACED: { label: 'Confirm Order', value: 'CONFIRMED', color: 'bg-emerald-500 hover:bg-emerald-600' },
  CONFIRMED: { label: 'Start Cooking', value: 'PREPARING', color: 'bg-amber-500 hover:bg-amber-600' },
  PREPARING: { label: 'Mark Ready for Pickup', value: 'READY_FOR_PICKUP', color: 'bg-violet-500 hover:bg-violet-600' },
};

export const ALL_STATUS_OPTIONS = [
  'ALL',
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export interface OrderManagementViewProps {
  role: 'ADMIN' | 'RESTAURANT_OWNER' | 'MANAGER';
  pageTitle: string;
  pageSubtitle: string;
  SidebarComponent?: React.ComponentType;

  // Restaurants
  restaurants: any[];
  selectedRestaurantId: string;
  onSelectRestaurantId: (id: string) => void;
  showAllRestaurantsOption?: boolean;

  // Custom top store switcher (e.g. for Manager)
  customStoreSwitcher?: React.ReactNode;

  // Orders data & state
  orders: any[];
  isLoading: boolean;
  onRefresh: () => void;

  // Users for resolving customer & driver details
  allUsers?: any[];

  // Order actions
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  onCancelOrder: (orderId: string, reason: string) => Promise<void>;

  // Admin-only driver assignment
  onAssignDriver?: (orderId: string, driver: { driverName: string; driverPhone: string; driverVehicleNumber: string }) => Promise<void>;
  driversList?: any[];

  // Pagination
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (newPage: number) => void;
}

export function OrderManagementView({
  role,
  pageTitle,
  pageSubtitle,
  SidebarComponent,
  restaurants,
  selectedRestaurantId,
  onSelectRestaurantId,
  showAllRestaurantsOption = false,
  customStoreSwitcher,
  orders,
  isLoading,
  onRefresh,
  allUsers = [],
  onUpdateStatus,
  onCancelOrder,
  onAssignDriver,
  driversList = [],
  page = 0,
  totalPages = 1,
  totalElements,
  onPageChange,
}: OrderManagementViewProps) {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOrder, setModalOrder] = useState<any | null>(null);

  // Driver modal state (Admin only)
  const [driverModalOrderId, setDriverModalOrderId] = useState<string | null>(null);
  const [selectedDriverUserId, setSelectedDriverUserId] = useState('');
  const [driverForm, setDriverForm] = useState({
    driverName: '',
    driverPhone: '9876543210',
    driverVehicleNumber: 'MH-01-AB-1234',
  });
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o: any) => {
      const st = o.status || 'PLACED';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord: any) => {
      const st = ord.status || 'PLACED';
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const id = String(ord.id || ord.orderId || '').toLowerCase();
      const cust = allUsers.find((u: any) => (u.id || u.userId) === ord.userId);
      const custName = String(cust?.fullName || ord.customerName || '').toLowerCase();
      const custPhone = String(cust?.phoneNumber || ord.customerPhone || '').toLowerCase();
      const addr = String(ord.deliveryAddress || '').toLowerCase();
      const itemsStr = (ord.items || []).map((i: any) => i.itemName || i.name || '').join(' ').toLowerCase();

      return id.includes(q) || custName.includes(q) || custPhone.includes(q) || addr.includes(q) || itemsStr.includes(q);
    });
  }, [orders, statusFilter, searchQuery, allUsers]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await onUpdateStatus(orderId, newStatus);
      if (modalOrder && (modalOrder.id || modalOrder.orderId) === orderId) {
        setModalOrder((m: any) => ({ ...m, status: newStatus }));
      }
      dispatch(addNotification({
        title: 'Order Status Updated',
        message: `Order #${orderId.slice(0, 8)} updated to ${newStatus.replace(/_/g, ' ')}`,
        type: 'order',
        link: role === 'ADMIN' ? '/admin/orders' : role === 'MANAGER' ? '/manager/orders' : '/owner/orders',
      }));
    } catch {
      // Handled in caller
    }
  };

  const handleCancelClick = async (orderId: string) => {
    const defaultReason =
      role === 'ADMIN'
        ? 'Cancelled by System Admin'
        : role === 'MANAGER'
        ? 'Cancelled by Store Manager'
        : 'Cancelled by Restaurant Owner';
    const reason = prompt('Enter cancellation reason:', defaultReason);
    if (reason === null) return;
    try {
      await onCancelOrder(orderId, reason);
      if (modalOrder && (modalOrder.id || modalOrder.orderId) === orderId) {
        setModalOrder((m: any) => ({ ...m, status: 'CANCELLED', cancellationReason: reason }));
      }
      dispatch(addNotification({
        title: 'Order Cancelled',
        message: `Order #${orderId.slice(0, 8)} was cancelled: ${reason}`,
        type: 'order',
      }));
    } catch {
      // Handled in caller
    }
  };

  const getDriverActiveOrder = (driver: any) => {
    if (!driver) return null;
    const uid = driver.id || driver.userId;
    const driverName = (driver.name || driver.fullName || '').toLowerCase().trim();
    const driverPhone = (driver.phone || driver.phoneNumber || '').replace(/\D/g, '');

    return orders.find((o: any) => {
      if (['DELIVERED', 'CANCELLED'].includes(o.status)) return false;
      const oDriverName = (o.driverName || '').toLowerCase().trim();
      const oDriverPhone = (o.driverPhone || '').replace(/\D/g, '');
      const oDriverId = o.driverId || o.updatedBy;

      if (driverPhone && oDriverPhone && oDriverPhone === driverPhone) return true;
      if (driverName && oDriverName && (oDriverName === driverName || oDriverName.includes(driverName) || driverName.includes(oDriverName))) return true;
      if (uid && oDriverId && (oDriverId === uid || oDriverId === driver.email)) return true;
      return false;
    }) || null;
  };

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverModalOrderId || !onAssignDriver) return;
    if (!driverForm.driverName.trim()) {
      toast.error('Please select an active driver');
      return;
    }

    const chosen = driversList.find((d: any) => (d.id || d.userId) === selectedDriverUserId);
    const activeOrder = getDriverActiveOrder(chosen);
    if (activeOrder) {
      toast.error(
        `Driver "${driverForm.driverName}" is currently busy with active Order #${String(activeOrder.id || activeOrder.orderId).slice(-8)}. Drivers cannot be assigned multiple orders until completed.`
      );
      return;
    }

    try {
      setIsSubmittingDriver(true);
      await onAssignDriver(driverModalOrderId, driverForm);
      toast.success(`Driver "${driverForm.driverName}" assigned successfully`);
      if (modalOrder && (modalOrder.id || modalOrder.orderId) === driverModalOrderId) {
        setModalOrder((m: any) => ({
          ...m,
          driverName: driverForm.driverName,
          driverPhone: driverForm.driverPhone,
          driverVehicleNumber: driverForm.driverVehicleNumber,
        }));
      }
      dispatch(addNotification({
        title: 'Driver Assigned',
        message: `Driver ${driverForm.driverName} assigned to order #${driverModalOrderId.slice(0, 8)}`,
        type: 'order',
      }));
      setDriverModalOrderId(null);
      setSelectedDriverUserId('');
      setDriverForm({ driverName: '', driverPhone: '9876543210', driverVehicleNumber: 'MH-01-AB-1234' });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to assign driver');
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Optional Custom Store Switcher (e.g. for Manager tab pills) */}
        {customStoreSwitcher}

        {/* Unified Page Header */}
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          badge={role}
          badgeVariant="default"
          actions={
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              title="Refresh Orders"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[var(--primary-color)]" />
              <span>Refresh</span>
            </button>
          }
        />

        {/* Filter Controls Bar */}
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          {/* Restaurant Selector Dropdown */}
          <div className="flex items-center gap-2 min-w-[260px] flex-1">
            <Store className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
            <select
              value={selectedRestaurantId}
              onChange={(e) => onSelectRestaurantId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary-color)]"
            >
              {showAllRestaurantsOption && (
                <option value="ALL">ALL RESTAURANTS (System Overview)</option>
              )}
              {restaurants.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.cuisineType ? `(${r.cuisineType})` : ''} {r.city ? `[${r.city}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, item, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-8 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-medium outline-none focus:border-[var(--primary-color)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs / Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ALL_STATUS_OPTIONS.map((st) => {
            const count = statusCounts[st] || 0;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--primary-color)] text-white shadow-md'
                    : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{st.replace(/_/g, ' ')}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-[var(--background-color)] text-[var(--text-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Unified Orders Container */}
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
          {/* Card Table Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--surface-color)]">
            <h3 className="font-outfit font-bold text-sm sm:text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[var(--primary-color)]" />
              <span>Incoming Orders</span>
              <span className="text-[var(--text-muted)] font-normal text-xs">
                ({totalElements !== undefined ? totalElements : filteredOrders.length} total)
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] bg-[var(--background-color)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>3s Live Sync</span>
              </span>
            </div>
          </div>

          {/* Orders Rows List */}
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Loading orders data...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <ClipboardList className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2 opacity-60" />
              <h4 className="font-outfit font-bold text-base text-[var(--text-primary)]">No Orders Found</h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                No orders match your filter criteria ({statusFilter !== 'ALL' ? statusFilter : 'all statuses'}
                {searchQuery ? ` matching "${searchQuery}"` : ''}).
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {filteredOrders.map((ord: any) => {
                const id = ord.orderId || ord.id;
                const items: any[] = ord.items || [];
                const effectiveDriverName = ord.driverName;

                // Resolve customer
                const customer = allUsers.find((u: any) => (u.id || u.userId) === ord.userId);
                const customerName = ord.customerName || customer?.name || customer?.fullName || 'Customer';
                const customerPhone = ord.customerPhone || customer?.phone;

                const fullDeliveryAddress = [
                  ord.deliveryAddress,
                  ord.deliveryArea,
                  ord.deliveryCity,
                  ord.deliveryPincode ? `PIN: ${ord.deliveryPincode}` : '',
                ]
                  .filter(Boolean)
                  .join(', ') || 'Standard Delivery Address';

                return (
                  <div
                    key={id}
                    className="p-5 hover:bg-[var(--background-color)]/50 transition-colors space-y-3 cursor-pointer group"
                    onClick={() => setModalOrder(ord)}
                  >
                    {/* Top Row: Meta Badges & Timestamp */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Order ID */}
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20 group-hover:bg-[var(--primary-color)] group-hover:text-white transition-all">
                          #{String(id).slice(-8).toUpperCase()}
                        </span>

                        {/* Status Pill */}
                        <StatusBadge status={ord.status} type="order" />

                        {/* Driver Tag */}
                        {effectiveDriverName ? (
                          <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>Courier: {effectiveDriverName}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Truck className="w-3 h-3 opacity-60" />
                            <span>Unassigned</span>
                          </span>
                        )}

                        {/* Payment Tag */}
                        {ord.paymentMethod && (
                          <span className="text-[11px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            <span>
                              {ord.paymentMethod.replace(/_/g, ' ')} ({ord.paymentStatus || 'PAID'})
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Created At Date */}
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0">
                        <Clock className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                        <span>{formatDate(ord.createdAt || new Date().toISOString())}</span>
                      </div>
                    </div>

                    {/* Middle Info: Customer & Destination Address */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                          <span>{customerName}</span>
                        </span>
                        {customerPhone && (
                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{customerPhone}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[var(--text-muted)] line-clamp-1 max-w-md">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{fullDeliveryAddress}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Info & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-[var(--text-muted)] space-y-0.5">
                        <p>
                          Items: <strong>{items.length || 1} item(s)</strong>{' '}
                          <span className="text-[var(--text-secondary)]">
                            ({items.map((i: any) => `${i.itemName || i.name} × ${i.quantity}`).join(', ') || 'Food Items'})
                          </span>
                        </p>
                        <p>
                          Total Amount:{' '}
                          <strong className="font-outfit text-sm font-extrabold text-[var(--primary-color)]">
                            {formatCurrency(ord.totalAmount || ord.subtotal || 0)}
                          </strong>
                        </p>
                        {ord.specialInstructions && (
                          <p className="text-[11px] text-amber-400 italic">
                            Special Instructions: {ord.specialInstructions}
                          </p>
                        )}
                        {ord.cancellationReason && (
                          <p className="text-[11px] text-rose-400 font-semibold">
                            Cancellation Reason: {ord.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Quick Next Status button */}
                        {NEXT_STATUS[ord.status] && (
                          <button
                            onClick={() => handleStatusUpdate(id, NEXT_STATUS[ord.status].value)}
                            className={`px-3.5 py-1.5 text-white text-xs font-bold rounded-xl transition-all shadow-xs ${NEXT_STATUS[ord.status].color}`}
                          >
                            {NEXT_STATUS[ord.status].label}
                          </button>
                        )}

                        {/* View & Manage Order button */}
                        <button
                          onClick={() => setModalOrder(ord)}
                          className="px-3.5 py-1.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                          <span>View & Manage</span>
                        </button>

                        {/* Admin-only Assign Courier Button */}
                        {role === 'ADMIN' && !effectiveDriverName && !['DELIVERED', 'CANCELLED'].includes(ord.status) && (
                          <button
                            onClick={() => {
                              setDriverModalOrderId(id);
                              setSelectedDriverUserId('');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Assign Courier</span>
                          </button>
                        )}

                        {/* Live Tracker link */}
                        <Link
                          href={ROUTES.TRACKING(id)}
                          className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                        >
                          <span>Tracker</span>
                          <ArrowRight className="w-3 h-3 text-[var(--primary-color)]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && onPageChange && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-[var(--border-color)] bg-[var(--surface-color)]">
              <button
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="px-4 py-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-xs font-mono font-bold">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
                className="px-4 py-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>

      {/* Detailed Order Operations Modal */}
      {modalOrder && (() => {
        const id = modalOrder.id || modalOrder.orderId;
        const items: any[] = modalOrder.items || [];
        const effectiveDriverName = modalOrder.driverName;
        const effectiveDriverPhone = modalOrder.driverPhone;
        const effectiveDriverVehicle = modalOrder.driverVehicleNumber;

        const customer = allUsers.find((u: any) => (u.id || u.userId) === modalOrder.userId);
        const customerName = modalOrder.customerName || customer?.name || customer?.fullName || 'Customer';
        const customerPhone = modalOrder.customerPhone || customer?.phone || 'N/A';
        const customerEmail = customer?.email;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                    #{String(id).slice(-8).toUpperCase()}
                  </span>
                  <StatusBadge status={modalOrder.status} type="order" />
                </div>
                <button
                  onClick={() => setModalOrder(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Delivery & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[var(--background-color)] p-4 rounded-xl border border-[var(--border-color)]">
                <div>
                  <p className="font-bold text-[var(--text-muted)] uppercase mb-1">Customer Delivery Details</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{customerName}</p>
                  <div className="text-[var(--text-secondary)] mt-1 space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{customerPhone}</span>
                    </p>
                    {customerEmail && <p className="opacity-80">✉ {customerEmail}</p>}
                    <p className="flex items-start gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {[
                          modalOrder.deliveryAddress,
                          modalOrder.deliveryArea,
                          modalOrder.deliveryCity,
                          modalOrder.deliveryPincode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[var(--text-muted)] uppercase mb-1">Order Information</p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    Payment Method: <strong>{modalOrder.paymentMethod || 'CARD'}</strong> (
                    {modalOrder.paymentStatus || 'PAID'})
                  </p>
                  <p className="text-[var(--text-secondary)] mt-1">
                    Created At: {formatDate(modalOrder.createdAt || new Date().toISOString())}
                  </p>
                  {modalOrder.restaurantName && (
                    <p className="text-[var(--text-secondary)] mt-1">
                      Restaurant: <strong>{modalOrder.restaurantName}</strong>
                    </p>
                  )}
                  {modalOrder.specialInstructions && (
                    <p className="text-amber-400 italic mt-1">
                      Note: {modalOrder.specialInstructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <h4 className="font-outfit font-bold text-sm flex items-center justify-between">
                  <span>Ordered Items ({items.length})</span>
                  <span className="text-[var(--primary-color)] font-extrabold text-base">
                    {formatCurrency(modalOrder.totalAmount || modalOrder.subtotal || 0)}
                  </span>
                </h4>
                <div className="border border-[var(--border-color)] rounded-xl overflow-hidden divide-y divide-[var(--border-color)]">
                  {items.length === 0 ? (
                    <p className="p-3 text-xs text-[var(--text-muted)] italic">No items detailed in order payload.</p>
                  ) : (
                    items.map((item: any, idx: number) => (
                      <div
                        key={item.orderItemId || idx}
                        className="p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">
                            {item.itemName || item.name || 'Food Item'}
                          </p>
                          <p className="text-[var(--text-muted)]">
                            Quantity: ×{item.quantity} · Price: {formatCurrency(item.price || 0)}
                          </p>
                        </div>
                        <span className="font-extrabold text-[var(--text-primary)]">
                          {formatCurrency((item.price || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kitchen Workflow & Operations */}
              <div className="space-y-3 bg-[var(--background-color)] p-4 rounded-xl border border-[var(--border-color)]">
                <h4 className="font-outfit font-bold text-xs uppercase text-[var(--primary-color)] tracking-wider">
                  Kitchen Status & Operations
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Change Order Status:</label>
                  <select
                    value={modalOrder.status}
                    onChange={(e) => handleStatusUpdate(id, e.target.value)}
                    className="px-3 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                  >
                    {['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      )
                    )}
                  </select>

                  {modalOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancelClick(id)}
                      className="px-3.5 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}

                  <Link
                    href={ROUTES.TRACKING(id)}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md ml-auto"
                  >
                    <span>Open Live Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Courier / Driver Assignment Section */}
              <div className="space-y-3 bg-[var(--background-color)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                  <h4 className="font-outfit font-bold text-xs uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Delivery Courier Details</span>
                  </h4>
                  {effectiveDriverName && (
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Assigned: {effectiveDriverName}
                    </span>
                  )}
                </div>

                {effectiveDriverName ? (
                  <div className="text-xs space-y-1 text-[var(--text-secondary)]">
                    <p>
                      <strong className="text-[var(--text-primary)]">Driver Name:</strong> {effectiveDriverName}
                    </p>
                    {effectiveDriverPhone && (
                      <p>
                        <strong className="text-[var(--text-primary)]">Driver Phone:</strong> 📞{' '}
                        {effectiveDriverPhone}
                      </p>
                    )}
                    {effectiveDriverVehicle && (
                      <p>
                        <strong className="text-[var(--text-primary)]">Vehicle:</strong> 🚗{' '}
                        {effectiveDriverVehicle}
                      </p>
                    )}
                    {role === 'ADMIN' && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setDriverModalOrderId(id);
                            setSelectedDriverUserId('');
                          }}
                          className="text-xs text-emerald-400 underline font-bold"
                        >
                          Reassign Different Driver
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-muted)] italic">
                      {role === 'ADMIN'
                        ? 'No delivery courier assigned to this order yet. You can assign a driver below.'
                        : 'No delivery courier assigned yet. Courier dispatch is managed exclusively by Platform Admin.'}
                    </p>
                    {role === 'ADMIN' && !['DELIVERED', 'CANCELLED'].includes(modalOrder.status) && (
                      <button
                        onClick={() => {
                          setDriverModalOrderId(id);
                          setSelectedDriverUserId('');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Assign Courier Now</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Links */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  href={`/orders/${id}`}
                  className="text-xs font-bold text-[var(--primary-color)] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Full Order Details & Invoice</span>
                </Link>

                <button
                  onClick={() => setModalOrder(null)}
                  className="px-5 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl hover:bg-[var(--surface-color)] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admin-only Driver Assignment Modal */}
      {driverModalOrderId && role === 'ADMIN' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>Assign Driver from User DB</span>
              </h3>
              <button
                onClick={() => setDriverModalOrderId(null)}
                className="p-1 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDriverSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Select Available Driver (DB role == DELIVERY_DRIVER) *
                </label>
                {driversList.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs space-y-1">
                    <p className="font-bold">No drivers registered in DB yet.</p>
                    <Link href="/admin/drivers" className="text-emerald-400 underline font-bold block">
                      → Click here to Register a Driver
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedDriverUserId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setSelectedDriverUserId(uid);
                      const chosen = driversList.find((d: any) => (d.id || d.userId) === uid);
                      if (chosen) {
                        setDriverForm({
                          driverName: chosen.name || 'Courier Driver',
                          driverPhone: chosen.phone || '9876543210',
                          driverVehicleNumber: 'MH-01-AB-1234',
                        });
                      }
                    }}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Choose available driver from DB --</option>
                    {driversList.map((d: any) => {
                      const uid = d.id || d.userId;
                      const activeOrder = getDriverActiveOrder(d);
                      const isBusy = !!activeOrder;
                      return (
                        <option key={uid} value={uid} disabled={isBusy}>
                          {d.name || d.fullName || 'Driver'} ({d.phone || 'No phone'}) - {isBusy ? `⚠️ BUSY (Order #${String(activeOrder.id || activeOrder.orderId).slice(-8)})` : '✅ AVAILABLE'}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Driver Name *</label>
                <input
                  type="text"
                  value={driverForm.driverName}
                  onChange={(e) => setDriverForm((f) => ({ ...f, driverName: e.target.value }))}
                  className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Driver Phone *</label>
                  <input
                    type="text"
                    value={driverForm.driverPhone}
                    onChange={(e) => setDriverForm((f) => ({ ...f, driverPhone: e.target.value }))}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Vehicle Plate *</label>
                  <input
                    type="text"
                    value={driverForm.driverVehicleNumber}
                    onChange={(e) => setDriverForm((f) => ({ ...f, driverVehicleNumber: e.target.value }))}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setDriverModalOrderId(null)}
                  className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDriver}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmittingDriver ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
