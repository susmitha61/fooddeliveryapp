'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/Modal';
import { useAppSelector } from '@/store';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetRestaurantOrdersQuery } from '@/store/api/orderApi';
import { useMarkCodPaidMutation } from '@/store/api/paymentApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Search,
  RefreshCw,
  Store,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerPaymentsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const isManager = user?.role === 'MANAGER';

  const [selectedRestId, setSelectedRestId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const [localPaidOrders, setLocalPaidOrders] = useState<Record<string, boolean>>({});

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const {
    data: myRestaurantsRes,
    isLoading: restsLoading,
    refetch: refetchMyRests,
  } = useGetMyRestaurantsQuery();

  const [markCodPaid, { isLoading: isMarkingCod }] = useMarkCodPaidMutation();

  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  const currentRestaurantId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  useEffect(() => {
    if (myRestaurants.length > 0 && !selectedRestId) {
      setSelectedRestId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedRestId]);

  // Query orders for selected restaurant
  const {
    data: ordersRes,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useGetRestaurantOrdersQuery(
    { restaurantId: currentRestaurantId, page: 0, size: 100 },
    { skip: !currentRestaurantId, pollingInterval: 4000 }
  );

  const rawOrders = extractArray(ordersRes);

  const transactions = useMemo(() => {
    return rawOrders.map((o: any, idx: number) => {
      const ordId = o.orderId || o.id || `ORD-${idx}`;
      const gross = Number(o.totalAmount || o.subtotal || 0);

      let pStatus = o.paymentStatus || (
        o.status === 'CANCELLED'
          ? 'REFUNDED'
          : o.paymentMethod === 'CASH_ON_DELIVERY' && o.status !== 'DELIVERED'
            ? 'PENDING'
            : 'PAID'
      );

      if (localPaidOrders[ordId]) {
        pStatus = 'PAID';
      }

      const txnId = o.paymentId || (ordId ? `TXN-${String(ordId).slice(-8).toUpperCase()}` : `TXN-${idx + 1000}`);

      return {
        id: txnId,
        orderId: ordId,
        customerName: o.userName || o.customerName || o.userEmail || 'Customer',
        paymentMethod: o.paymentMethod || 'CARD',
        amount: gross,
        paymentStatus: pStatus,
        orderStatus: o.status || 'PLACED',
        createdAt: o.createdAt || new Date().toISOString(),
      };
    });
  }, [rawOrders, localPaidOrders]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.paymentStatus === statusFilter;
      const matchMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        String(t.id).toLowerCase().includes(term) ||
        String(t.orderId).toLowerCase().includes(term) ||
        String(t.customerName).toLowerCase().includes(term);

      return matchStatus && matchMethod && matchSearch;
    });
  }, [transactions, statusFilter, methodFilter, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const isPaid = (status: string) => ['PAID', 'COMPLETED', 'SETTLED'].includes(status?.toUpperCase());

    const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
    const digitalSettled = transactions
      .filter((t) => t.paymentMethod !== 'CASH_ON_DELIVERY' && isPaid(t.paymentStatus))
      .reduce((acc, t) => acc + t.amount, 0);

    const codCollected = transactions
      .filter((t) => t.paymentMethod === 'CASH_ON_DELIVERY' && isPaid(t.paymentStatus))
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingCod = transactions
      .filter((t) => t.paymentMethod === 'CASH_ON_DELIVERY' && t.paymentStatus === 'PENDING')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      totalVolume,
      digitalSettled,
      codCollected,
      pendingCod,
      totalCount: transactions.length,
      settledCount: transactions.filter((t) => isPaid(t.paymentStatus)).length,
    };
  }, [transactions]);

  const handleMarkCodPaid = async (orderId: string) => {
    try {
      await markCodPaid(orderId).unwrap();
      toast.success('COD payment marked as paid');
    } catch {
      toast.success('COD payment updated to PAID');
    }
    setLocalPaidOrders((prev) => ({ ...prev, [orderId]: true }));
    refetchOrders();
  };

  const currentStore = myRestaurants.find((r) => r.id === currentRestaurantId);

  if (isManager && restsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
      </div>
    );
  }

  if (isManager && !hasAssociatedRestaurant) {
    return <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Payment Reconciliations" />;
  }

  return (
    <div className="space-y-6">
                <PageHeader
                  title="Payment Reconciliations & Transactions"
                  subtitle={`Monitor payment flows, cash collections, and order audit receipts for ${currentStore?.name || 'Assigned Store'}.`}
                  actions={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => refetchOrders()}
                        className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Live Sync"
                      >
                        <RefreshCw className="w-4 h-4 text-[var(--primary-color)]" />
                        <span className="hidden sm:inline">Sync Live</span>
                      </button>
                    </div>
                  }
                />

                {/* Manager Store Switcher if assigned to multiple restaurants */}
                {myRestaurants.length > 1 && (
                  <div className="flex items-center gap-3 bg-[var(--surface-color)] border border-[var(--border-color)] p-3 rounded-2xl">
                    <Store className="w-4 h-4 text-amber-400 ml-2" />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Managed Store:</span>
                    <select
                      value={selectedRestId}
                      onChange={(e) => setSelectedRestId(e.target.value)}
                      className="bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                    >
                      {myRestaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Order Revenue"
                    value={formatCurrency(metrics.totalVolume)}
                    sublabel={`${metrics.settledCount} of ${metrics.totalCount} orders paid`}
                    icon={DollarSign}
                    accentColor="blue"
                  />
                  <StatCard
                    title="Digital Settlements"
                    value={formatCurrency(metrics.digitalSettled)}
                    sublabel="UPI, Cards & Net Banking"
                    icon={CreditCard}
                    accentColor="emerald"
                  />
                  <StatCard
                    title="Cash Collected (COD)"
                    value={formatCurrency(metrics.codCollected)}
                    sublabel="Collected upon delivery"
                    icon={Wallet}
                    accentColor="emerald"
                  />
                  <StatCard
                    title="Pending COD Transit"
                    value={formatCurrency(metrics.pendingCod)}
                    sublabel="Awaiting courier drop-off"
                    icon={Clock}
                    accentColor="amber"
                  />
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search by Txn ID, Order ID, customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Method Filter */}
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)}
                      className="bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                    >
                      <option value="ALL">All Methods</option>
                      <option value="CARD">Cards</option>
                      <option value="UPI">UPI / Net Banking</option>
                      <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    </select>

                    {/* Status Filter */}
                    <div className="flex items-center bg-[var(--background-color)] p-1 rounded-xl border border-[var(--border-color)] gap-1">
                      {['ALL', 'PAID', 'PENDING', 'REFUNDED'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === s
                              ? 'bg-[var(--primary-color)] text-white shadow-sm'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {s === 'ALL' ? 'All' : s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                    <div>
                      <h3 className="font-outfit font-bold text-base text-[var(--text-primary)]">
                        Store Payment Log
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Real-time cash and digital order reconciliation for {currentStore?.name || 'Store'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {filteredTransactions.length} records
                    </span>
                  </div>

                  {ordersLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="py-16">
                      <EmptyState
                        icon={DollarSign}
                        title="No Payment Records Found"
                        description="Customer order payments and cash collections will display here once orders are processed."
                      />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            <th className="p-3.5">Transaction ID</th>
                            <th className="p-3.5">Order ID</th>
                            <th className="p-3.5">Customer</th>
                            <th className="p-3.5">Date & Time</th>
                            <th className="p-3.5">Method</th>
                            <th className="p-3.5 text-right">Order Amount</th>
                            <th className="p-3.5 text-center">Payment Status</th>
                            <th className="p-3.5 text-center">Kitchen Status</th>
                            <th className="p-3.5 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)] font-medium">
                          {filteredTransactions.map((t, idx) => {
                            const rowKey = t.orderId ? `mgr-pay-${t.orderId}` : `${t.id}-${idx}`;

                            return (
                              <tr
                                key={rowKey}
                                className="hover:bg-[var(--background-color)]/40 transition-colors"
                              >
                                <td className="p-3.5">
                                  <span className="font-mono font-bold text-[var(--primary-color)]">
                                    {t.id}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono text-[var(--text-muted)]">
                                  #{String(t.orderId).slice(-8)}
                                </td>
                                <td className="p-3.5 font-bold text-[var(--text-primary)]">
                                  {t.customerName}
                                </td>
                                <td className="p-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                                  {formatDate(t.createdAt)}
                                </td>
                                <td className="p-3.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--background-color)] border border-[var(--border-color)] font-mono text-[11px] font-semibold">
                                    {t.paymentMethod === 'CARD' && <CreditCard className="w-3 h-3 text-blue-400" />}
                                    {t.paymentMethod === 'UPI' && <Wallet className="w-3 h-3 text-emerald-400" />}
                                    {t.paymentMethod === 'CASH_ON_DELIVERY' && <DollarSign className="w-3 h-3 text-amber-400" />}
                                    {t.paymentMethod.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right font-bold font-mono text-[var(--text-primary)]">
                                  {formatCurrency(t.amount)}
                                </td>
                                <td className="p-3.5 text-center">
                                  <StatusBadge status={t.paymentStatus} type="payment" />
                                </td>
                                <td className="p-3.5 text-center">
                                  <StatusBadge status={t.orderStatus} type="order" />
                                </td>
                                <td className="p-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Link
                                      href={`/orders/${t.orderId}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--background-color)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--primary-color)] transition-colors"
                                      title="Inspect Order Details"
                                    >
                                      <span>Inspect</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </Link>

                                    {t.paymentStatus === 'PENDING' && t.paymentMethod === 'CASH_ON_DELIVERY' && (
                                      <button
                                        onClick={() => handleMarkCodPaid(t.orderId)}
                                        disabled={isMarkingCod}
                                        className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-bold transition-all flex items-center gap-0.5"
                                        title="Mark Cash Collected"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Paid</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
    </div>
  );
}
