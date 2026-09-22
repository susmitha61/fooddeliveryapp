'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store';
import { useGetDriverOrdersQuery } from '@/store/api/orderApi';
import { formatCurrency, formatDate, isDriverAssignedToOrder, parseOrderDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  Package,
  CheckCircle2,
  MapPin,
  TrendingUp,
  DollarSign,
  Search,
  Truck,
  Store,
  FileText,
  Clock,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Receipt,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverHistoryPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const {
    data: ordersRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetDriverOrdersQuery({ page: 0, size: 100 }, { pollingInterval: 5000 });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allDelivered: any[] = useMemo(() => {
    return extractArray(ordersRes).filter(
      (o: any) => isDriverAssignedToOrder(o, user) && o.status === 'DELIVERED'
    );
  }, [ordersRes, user]);

  const filteredByPeriod = useMemo(() => {
    if (periodFilter === 'ALL') return allDelivered;

    const currTime = new Date();
    const startOfToday = new Date(currTime.getFullYear(), currTime.getMonth(), currTime.getDate(), 0, 0, 0, 0);
    const startOfWeek = new Date(currTime.getFullYear(), currTime.getMonth(), currTime.getDate() - currTime.getDay(), 0, 0, 0, 0);
    const startOfMonth = new Date(currTime.getFullYear(), currTime.getMonth(), 1, 0, 0, 0, 0);

    return allDelivered.filter((o: any) => {
      const dateVal = o.deliveredAt || o.updatedAt || o.createdAt;
      if (!dateVal) return true;
      const orderDate = parseOrderDate(dateVal);
      if (!orderDate || isNaN(orderDate.getTime())) return true;

      const orderMs = orderDate.getTime();
      const currMs = currTime.getTime();
      const diffMs = currMs - orderMs;

      if (periodFilter === 'TODAY') {
        return orderDate >= startOfToday || (diffMs >= 0 && diffMs <= 86400000);
      }
      if (periodFilter === 'WEEK') {
        return orderDate >= startOfWeek || (diffMs >= 0 && diffMs <= 7 * 86400000);
      }
      if (periodFilter === 'MONTH') {
        return orderDate >= startOfMonth || (diffMs >= 0 && diffMs <= 30 * 86400000);
      }
      return true;
    });
  }, [allDelivered, periodFilter]);

  const finalOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return filteredByPeriod;

    return filteredByPeriod.filter((o: any) => {
      const idMatch = String(o.orderId || o.id || '').toLowerCase().includes(term);
      const restMatch = String(o.restaurantName || '').toLowerCase().includes(term);
      const addrMatch = String(o.deliveryAddress || '').toLowerCase().includes(term);
      const cityMatch = String(o.deliveryCity || '').toLowerCase().includes(term);
      const itemsMatch = (o.items || []).some((it: any) =>
        String(it.itemName || it.name || '').toLowerCase().includes(term)
      );
      return idMatch || restMatch || addrMatch || cityMatch || itemsMatch;
    });
  }, [filteredByPeriod, searchTerm]);

  const totalDeliveries = filteredByPeriod.length;
  // Estimated driver payout: base $5.00 per delivery + 10% tip
  const totalPayout = filteredByPeriod.reduce(
    (acc, o) => acc + 5.0 + Number(o.totalAmount || 0) * 0.1,
    0
  );
  const totalFoodVolume = filteredByPeriod.reduce(
    (acc, o) => acc + Number(o.totalAmount || 0),
    0
  );
  const avgPayout = totalDeliveries > 0 ? totalPayout / totalDeliveries : 0;

  const handleRefresh = () => {
    refetch();
    toast.success('Synced delivery history with server');
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Delivery Trip History"
          description="View your completed drop-offs, delivered order details, and payout manifests."
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-emerald-500 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Sync History'}</span>
          </button>
        </div>
      </div>

      {/* Courier Identity Callout */}
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
              Authenticated Courier Partner
            </span>
            <p className="font-extrabold text-sm text-[var(--text-primary)]">
              {user?.name || user?.email?.split('@')[0] || 'Delivery Driver'}{' '}
              <span className="font-normal text-[var(--text-secondary)]">({user?.email})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold">
            ✓ Verified Courier
          </span>
          <span className="px-3 py-1 bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/30 text-[var(--primary-color)] rounded-xl font-bold">
            {totalDeliveries} Completed Drops
          </span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completed Deliveries"
          value={totalDeliveries}
          icon={Truck}
          colorClass="text-emerald-400"
          trend="100% completion rate"
        />
        <StatCard
          title="Total Estimated Earnings"
          value={formatCurrency(totalPayout)}
          icon={DollarSign}
          colorClass="text-[var(--primary-color)]"
          trend="Base fee ($5) + customer tips"
        />
        <StatCard
          title="Avg Payout / Delivery"
          value={formatCurrency(avgPayout)}
          icon={TrendingUp}
          colorClass="text-amber-400"
          trend="Per completed drop-off"
        />
        <StatCard
          title="Total Delivered Volume"
          value={formatCurrency(totalFoodVolume)}
          icon={Package}
          colorClass="text-sky-400"
          trend="Food value delivered"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface-color)] border border-[var(--border-color)] p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by order ID, restaurant, dish, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-[var(--background-color)] p-1 rounded-xl border border-[var(--border-color)]">
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: 'WEEK', label: 'This Week' },
                { id: 'MONTH', label: 'This Month' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriodFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  periodFilter === t.id
                    ? 'bg-[var(--primary-color)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[var(--background-color)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode('TABLE')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-[var(--primary-color)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              title="Cards View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-[var(--primary-color)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delivery List Content */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : finalOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Delivered Trips Found"
          description={
            searchTerm || periodFilter !== 'ALL'
              ? 'No deliveries match your active search or date filter.'
              : 'You have not completed any deliveries yet. Orders you accept and mark delivered will appear here with full manifest details.'
          }
          action={
            <Link
              href={ROUTES.DRIVER_ORDERS}
              className="px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>View Active Deliveries</span>
            </Link>
          }
        />
      ) : viewMode === 'TABLE' ? (
        /* ── TABLE VIEW ───────────────────────────────── */
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-outfit font-bold text-sm">
                Completed Drop-offs ({finalOrders.length})
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Settled Trips
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Restaurant</th>
                  <th className="py-3.5 px-4">Customer Destination</th>
                  <th className="py-3.5 px-4">Items Manifest</th>
                  <th className="py-3.5 px-4">Order Total</th>
                  <th className="py-3.5 px-4">Your Earnings</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {finalOrders.map((o: any) => {
                  const oid = o.orderId || o.id;
                  const items: any[] = o.items || [];
                  const orderTotal = Number(o.totalAmount || o.subtotal || 0);
                  const baseFee = 5.0;
                  const tip = +(orderTotal * 0.1).toFixed(2);
                  const payout = +(baseFee + tip).toFixed(2);

                  return (
                    <tr key={oid} className="hover:bg-[var(--background-color)]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold font-mono text-[var(--text-primary)] block">
                              #{String(oid).slice(-8).toUpperCase()}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] block">
                              {o.deliveredAt
                                ? formatDate(o.deliveredAt)
                                : o.updatedAt
                                ? formatDate(o.updatedAt)
                                : formatDate(o.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                          <Store className="w-3.5 h-3.5 text-[var(--primary-color)] shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {o.restaurantName || 'Restaurant Partner'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        <p className="font-medium text-[var(--text-primary)] truncate max-w-xs">
                          {o.deliveryAddress || 'Delivery Address'}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>
                            {[o.deliveryArea, o.deliveryCity, o.deliveryPincode]
                              .filter(Boolean)
                              .join(', ') || 'Local Dropoff'}
                          </span>
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {items.length > 0 ? (
                          <div className="space-y-0.5 max-w-[200px]">
                            <p className="font-medium text-[var(--text-primary)] truncate">
                              {items.map((i) => `${i.itemName || i.name} (×${i.quantity})`).join(', ')}
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--background-color)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
                              {items.length} item(s)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] italic">
                            Delivered Package
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {formatCurrency(orderTotal)}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          {o.paymentMethod || 'CARD'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-extrabold text-emerald-400 text-sm block">
                          +{formatCurrency(payout)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          $5.00 base + {formatCurrency(tip)} tip
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1.5 bg-[var(--background-color)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                            title="View Full Delivery Manifest"
                          >
                            <Eye className="w-3 h-3 text-[var(--primary-color)]" />
                            <span>Details</span>
                          </button>

                          <Link
                            href={ROUTES.TRACKING(oid)}
                            className="p-1.5 bg-[var(--background-color)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--primary-color)] rounded-lg transition-colors"
                            title="View Tracking Archive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── CARDS VIEW ───────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {finalOrders.map((o: any) => {
            const oid = o.orderId || o.id;
            const items: any[] = o.items || [];
            const orderTotal = Number(o.totalAmount || o.subtotal || 0);
            const baseFee = 5.0;
            const tip = +(orderTotal * 0.1).toFixed(2);
            const payout = +(baseFee + tip).toFixed(2);

            return (
              <div
                key={oid}
                className="bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
                        #{String(oid).slice(-8).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        DELIVERED
                      </span>
                    </div>
                    <h4 className="font-outfit font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[var(--primary-color)] shrink-0" />
                      <span>{o.restaurantName || 'Restaurant Partner'}</span>
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                      Trip Payout
                    </span>
                    <span className="font-mono font-extrabold text-emerald-400 text-base block">
                      +{formatCurrency(payout)}
                    </span>
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    Drop-off Location
                  </span>
                  <div className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{o.deliveryAddress || 'Standard Address'}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {[o.deliveryArea, o.deliveryCity, o.deliveryPincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items preview */}
                {items.length > 0 && (
                  <div className="p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)] text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                      Items Delivered ({items.length})
                    </span>
                    <p className="font-medium text-[var(--text-secondary)] line-clamp-2">
                      {items.map((i) => `${i.itemName || i.name} (×${i.quantity})`).join(', ')}
                    </p>
                  </div>
                )}

                {/* Meta details & Action */}
                <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {o.deliveredAt
                        ? formatDate(o.deliveredAt)
                        : o.updatedAt
                        ? formatDate(o.updatedAt)
                        : formatDate(o.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-3 py-1.5 bg-[var(--background-color)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-[var(--primary-color)]" />
                      <span>Manifest</span>
                    </button>

                    <Link
                      href={`/orders/${oid}`}
                      className="px-3 py-1.5 bg-[var(--primary-color)] text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-110 transition-all flex items-center gap-1"
                    >
                      <span>Receipt</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DELIVERY MANIFEST MODAL ───────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-outfit font-extrabold text-lg">
                      Delivery Manifest
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                      #{String(selectedOrder.orderId || selectedOrder.id).slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Completed & Settled Courier Trip
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-[var(--background-color)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Restaurant & Destination Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[var(--background-color)] rounded-2xl border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Store className="w-3 h-3 text-[var(--primary-color)]" />
                  Pickup Kitchen
                </span>
                <p className="font-bold text-xs text-[var(--text-primary)]">
                  {selectedOrder.restaurantName || 'Partner Kitchen'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  ID: {selectedOrder.restaurantId || 'N/A'}
                </p>
              </div>

              <div className="p-3.5 bg-[var(--background-color)] rounded-2xl border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  Customer Drop-off
                </span>
                <p className="font-bold text-xs text-[var(--text-primary)]">
                  {selectedOrder.deliveryAddress || 'Standard Drop-off'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {[selectedOrder.deliveryArea, selectedOrder.deliveryCity, selectedOrder.deliveryPincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>

            {/* Itemized Manifest */}
            <div className="space-y-2">
              <h4 className="font-outfit font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                <span>Delivered Order Items ({selectedOrder.items?.length || 0})</span>
              </h4>

              <div className="bg-[var(--background-color)] rounded-2xl border border-[var(--border-color)] p-3 divide-y divide-[var(--border-color)] text-xs">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((it: any, idx: number) => {
                    const price = Number(it.price || it.itemPrice || 0);
                    const qty = Number(it.quantity || 1);
                    const total = Number(it.itemTotal || price * qty);

                    return (
                      <div key={idx} className="py-2 flex items-center justify-between first:pt-1 last:pb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              it.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-semibold text-[var(--text-primary)]">
                            {it.itemName || it.name}
                          </span>
                          <span className="text-[var(--text-muted)]">×{qty}</span>
                        </div>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-2 text-[var(--text-muted)] italic">
                    Food order items recorded in system database.
                  </p>
                )}
              </div>
            </div>

            {/* Courier Settlement Calculation */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-outfit font-bold text-xs uppercase text-emerald-400 tracking-wider">
                  Driver Trip Settlement
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-black">
                  SETTLED
                </span>
              </div>

              <div className="text-xs space-y-1 text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Base Courier Dispatch Fee:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">$5.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Tip (10% of order):</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {formatCurrency(Number(selectedOrder.totalAmount || 0) * 0.1)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-emerald-500/30 pt-1.5 mt-1 font-extrabold text-sm text-emerald-400">
                  <span>Total Driver Payout:</span>
                  <span className="font-mono">
                    +{formatCurrency(5.0 + Number(selectedOrder.totalAmount || 0) * 0.1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Timestamps */}
            <div className="border-t border-[var(--border-color)] pt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                  Customer Payment
                </span>
                <p className="font-bold text-[var(--text-primary)]">
                  {selectedOrder.paymentMethod || 'CARD'} ({selectedOrder.paymentStatus || 'PAID'})
                </p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Total Paid: {formatCurrency(selectedOrder.totalAmount || 0)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                  Completed Timestamp
                </span>
                <p className="font-bold text-[var(--text-primary)]">
                  {selectedOrder.deliveredAt
                    ? formatDate(selectedOrder.deliveredAt)
                    : selectedOrder.updatedAt
                    ? formatDate(selectedOrder.updatedAt)
                    : formatDate(selectedOrder.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
              <Link
                href={`/orders/${selectedOrder.orderId || selectedOrder.id}`}
                className="px-4 py-2 bg-[var(--background-color)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                <span>Full Receipt</span>
              </Link>
              <Link
                href={ROUTES.TRACKING(selectedOrder.orderId || selectedOrder.id)}
                className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Tracking Archive</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
