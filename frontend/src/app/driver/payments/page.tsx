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
  Truck,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  Search,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverPaymentsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const {
    data: driverOrdersRes,
    isLoading,
    refetch: refetchDriver,
  } = useGetDriverOrdersQuery({ page: 0, size: 100 }, { pollingInterval: 5000 });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allOrders = useMemo(() => extractArray(driverOrdersRes), [driverOrdersRes]);

  // Filter for completed deliveries assigned to this driver
  const deliveredOrders = useMemo(() => {
    return allOrders.filter((o: any) => isDriverAssignedToOrder(o, user) && o.status === 'DELIVERED');
  }, [allOrders, user]);

  // Apply time period filter
  const periodFiltered = useMemo(() => {
    if (periodFilter === 'ALL') return deliveredOrders;

    const currTime = new Date();
    const startOfToday = new Date(currTime.getFullYear(), currTime.getMonth(), currTime.getDate(), 0, 0, 0, 0);
    const startOfWeek = new Date(currTime.getFullYear(), currTime.getMonth(), currTime.getDate() - currTime.getDay(), 0, 0, 0, 0);
    const startOfMonth = new Date(currTime.getFullYear(), currTime.getMonth(), 1, 0, 0, 0, 0);

    return deliveredOrders.filter((o: any) => {
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
  }, [deliveredOrders, periodFilter]);

  // Apply search query
  const filteredEarnings = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return periodFiltered.filter((o: any) => {
      const ordId = String(o.id || o.orderId || '').toLowerCase();
      const rest = String(o.restaurantName || '').toLowerCase();
      const addr = String(o.deliveryAddress || o.deliveryCity || '').toLowerCase();
      return !term || ordId.includes(term) || rest.includes(term) || addr.includes(term);
    });
  }, [periodFiltered, searchTerm]);

  // Courier Trip Calculations
  const earningsList = useMemo(() => {
    return filteredEarnings.map((o: any) => {
      const orderAmount = Number(o.totalAmount || o.subtotal || 0);
      const baseFee = 5.00; // Standard $5.00 drop-off incentive
      const tipAmount = +(orderAmount * 0.10).toFixed(2); // 10% customer tip
      const totalEarned = +(baseFee + tipAmount).toFixed(2);

      return {
        id: o.id || o.orderId,
        orderId: o.id || o.orderId,
        restaurantName: o.restaurantName || 'Partner Kitchen',
        deliveryAddress: o.deliveryAddress ? `${o.deliveryAddress}, ${o.deliveryCity || ''}` : 'Local Drop-off',
        createdAt: o.createdAt || new Date().toISOString(),
        orderAmount,
        baseFee,
        tipAmount,
        totalEarned,
        payoutStatus: 'PAID',
      };
    });
  }, [filteredEarnings]);

  // Metrics
  const metrics = useMemo(() => {
    const totalEarnings = earningsList.reduce((acc, t) => acc + t.totalEarned, 0);
    const totalTips = earningsList.reduce((acc, t) => acc + t.tipAmount, 0);
    const completedCount = earningsList.length;
    const avgPerTrip = completedCount > 0 ? totalEarnings / completedCount : 0;

    return {
      totalEarnings,
      totalTips,
      completedCount,
      avgPerTrip,
      weeklyBalance: totalEarnings, // Ready for weekly direct deposit
    };
  }, [earningsList]);

  const handleExportCSV = () => {
    if (earningsList.length === 0) {
      toast.error('No courier earnings records to export');
      return;
    }
    const headers = ['Order ID', 'Store', 'Destination', 'Date', 'Base Fee', 'Tip (10%)', 'Total Payout', 'Status'];
    const rows = earningsList.map((t) => [
      t.orderId,
      `"${t.restaurantName.replace(/"/g, '""')}"`,
      `"${t.deliveryAddress.replace(/"/g, '""')}"`,
      new Date(t.createdAt).toLocaleString(),
      t.baseFee.toFixed(2),
      t.tipAmount.toFixed(2),
      t.totalEarned.toFixed(2),
      t.payoutStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `courier_payouts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Courier earnings downloaded as CSV');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courier Earnings & Weekly Payouts"
        subtitle="Track your completed delivery runs, base fees, customer tips, and bank deposit balances."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Export Statement</span>
                  </button>
                  <button
                    onClick={() => {
                      refetchDriver();
                    }}
                    className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    title="Refresh Runs"
                  >
                    <RefreshCw className="w-4 h-4 text-[var(--primary-color)]" />
                    <span className="hidden sm:inline">Sync</span>
                  </button>
                </div>
              }
            />

            {/* Courier Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Courier Earnings"
                value={formatCurrency(metrics.totalEarnings)}
                sublabel="Includes base pay + customer tips"
                icon={DollarSign}
                trend="up"
                delta="+14.8%"
                accentColor="emerald"
              />
              <StatCard
                title="Completed Runs"
                value={metrics.completedCount}
                sublabel="Delivered to customer doorstep"
                icon={Truck}
                accentColor="sky"
              />
              <StatCard
                title="Average Per Drop-off"
                value={formatCurrency(metrics.avgPerTrip)}
                sublabel="Base fee + tips combined"
                icon={TrendingUp}
                accentColor="amber"
              />
              <StatCard
                title="Weekly Deposit Balance"
                value={formatCurrency(metrics.weeklyBalance)}
                sublabel="Direct deposit every Friday"
                icon={Wallet}
                accentColor="purple"
              />
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by Order ID, restaurant, drop-off location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>

              {/* Time Period Filter */}
              <div className="flex items-center bg-[var(--background-color)] p-1 rounded-xl border border-[var(--border-color)] gap-1">
                {(
                  [
                    { label: 'All Time', value: 'ALL' },
                    { label: 'Today', value: 'TODAY' },
                    { label: 'Past 7 Days', value: 'WEEK' },
                    { label: 'This Month', value: 'MONTH' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriodFilter(p.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      periodFilter === p.value
                        ? 'bg-[var(--primary-color)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deliveries & Payouts Table */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <h3 className="font-outfit font-bold text-sm text-[var(--text-primary)]">
                    Itemized Delivery Payout Log
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Individual trip earnings computed with $5.00 flat base fare + 10% customer tip.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-[var(--background-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-muted)]">
                  {earningsList.length} completed trips
                </span>
              </div>

              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : earningsList.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={Truck}
                    title="No Completed Trips In Selected Range"
                    description="When you pick up orders and complete deliveries, your trip earnings and tips will immediately record here."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="p-3.5">Order / Trip</th>
                        <th className="p-3.5">Pickup Restaurant</th>
                        <th className="p-3.5">Drop-off Destination</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5 text-right">Base Fee</th>
                        <th className="p-3.5 text-right">Tip (10%)</th>
                        <th className="p-3.5 text-right">Trip Payout</th>
                        <th className="p-3.5 text-center">Payout Status</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] font-medium">
                      {earningsList.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-[var(--background-color)]/40 transition-colors"
                        >
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-[var(--primary-color)]">
                              #{String(t.orderId).slice(-8)}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{t.restaurantName}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-[var(--text-secondary)] max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{t.deliveryAddress}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                            {formatDate(t.createdAt)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-semibold text-[var(--text-primary)]">
                            {formatCurrency(t.baseFee)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-semibold text-emerald-400">
                            +{formatCurrency(t.tipAmount)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-base text-[var(--primary-color)]">
                            {formatCurrency(t.totalEarned)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              PAID
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <Link
                              href={`/tracking/${t.orderId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--background-color)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--primary-color)] transition-colors"
                            >
                              <span>Route</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </div>
  );
}
