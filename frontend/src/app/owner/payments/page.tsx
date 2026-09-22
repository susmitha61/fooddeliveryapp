'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetOwnerOrdersQuery } from '@/store/api/orderApi';
import { useMarkCodPaidMutation, useProcessRefundMutation } from '@/store/api/paymentApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  RefreshCw,
  Store,
  ArrowUpRight,
  Download,
  Wallet,
  CheckCircle2,
  Clock,
  RotateCcw,
  Building2,
  Check,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerPaymentsPage() {
  const [selectedRestId, setSelectedRestId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modals state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data: restsRes, isLoading: restsLoading } = useGetMyRestaurantsQuery();
  const restaurants: any[] = restsRes?.data || [];

  // Query all orders across owner's portfolio
  const { data: ownerOrdersRes, isLoading: ordersLoading, refetch } = useGetOwnerOrdersQuery(
    { page: 0, size: 200 },
    { pollingInterval: 5000 }
  );

  const [markCodPaid, { isLoading: isMarkingCod }] = useMarkCodPaidMutation();
  const [processRefund, { isLoading: isRefunding }] = useProcessRefundMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    return [];
  };

  const allOrders = extractArray(ownerOrdersRes);

  // Filter orders that belong to owner's restaurants
  const ownerRestIds = useMemo(() => new Set(restaurants.map((r) => r.id)), [restaurants]);

  const ownerOrders = useMemo(() => {
    if (restaurants.length === 0) return allOrders;
    return allOrders.filter((o: any) => {
      if (!o.restaurantId) return true;
      return ownerRestIds.has(o.restaurantId);
    });
  }, [allOrders, restaurants, ownerRestIds]);

  // Map to structured transactions
  // Map to structured transactions
  const transactions = useMemo(() => {
    return ownerOrders.map((o: any, idx: number) => {
      const ordId = o.orderId || o.id || `ORD-MANUAL-${idx}`;
      const gross = Number(o.totalAmount || o.subtotal || 0);
      const commission = gross * 0.10; // 10% platform fee
      const netPayout = gross - commission;

      const pStatus = o.paymentStatus || (
        o.status === 'CANCELLED'
          ? 'REFUNDED'
          : o.paymentMethod === 'CASH_ON_DELIVERY' && o.status !== 'DELIVERED'
            ? 'PENDING'
            : 'PAID'
      );

      // Unique Txn ID with fallbacks
      const txnId = o.paymentId || (ordId ? `TXN-${String(ordId).slice(-8).toUpperCase()}` : `TXN-${idx + 1000}`);

      return {
        id: txnId,
        orderId: ordId,
        restaurantId: o.restaurantId || '',
        restaurantName: o.restaurantName || restaurants.find((r) => r.id === o.restaurantId)?.name || 'Store',
        customerName: o.userName || o.customerName || o.userEmail || 'Customer',
        paymentMethod: o.paymentMethod || 'CARD',
        grossAmount: gross,
        commission,
        netPayout,
        paymentStatus: pStatus,
        orderStatus: o.status || 'PLACED',
        createdAt: o.createdAt || new Date().toISOString(),
      };
    });
  }, [ownerOrders, restaurants]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchStore = selectedRestId === 'ALL' || t.restaurantId === selectedRestId;
      const matchStatus = statusFilter === 'ALL' || t.paymentStatus === statusFilter;
      const matchMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        String(t.id).toLowerCase().includes(term) ||
        String(t.orderId).toLowerCase().includes(term) ||
        String(t.customerName).toLowerCase().includes(term) ||
        String(t.restaurantName).toLowerCase().includes(term);

      return matchStore && matchStatus && matchMethod && matchSearch;
    });
  }, [transactions, selectedRestId, statusFilter, methodFilter, searchTerm]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const validTxns = selectedRestId === 'ALL'
      ? transactions
      : transactions.filter((t) => t.restaurantId === selectedRestId);

    const isPaid = (status: string) => ['PAID', 'COMPLETED', 'SETTLED'].includes(status?.toUpperCase());

    const grossSales = validTxns
      .filter((t) => isPaid(t.paymentStatus))
      .reduce((sum, t) => sum + t.grossAmount, 0);

    const netPayout = validTxns
      .filter((t) => isPaid(t.paymentStatus))
      .reduce((sum, t) => sum + t.netPayout, 0);

    const platformFees = validTxns
      .filter((t) => isPaid(t.paymentStatus))
      .reduce((sum, t) => sum + t.commission, 0);

    const pendingCod = validTxns
      .filter((t) => t.paymentMethod === 'CASH_ON_DELIVERY' && t.paymentStatus === 'PENDING')
      .reduce((sum, t) => sum + t.grossAmount, 0);

    return {
      grossSales,
      netPayout,
      platformFees,
      pendingCod,
      totalOrders: validTxns.length,
      completedOrders: validTxns.filter((t) => isPaid(t.paymentStatus)).length,
    };
  }, [transactions, selectedRestId]);

  // Quick Action: Mark COD as Paid
  const handleMarkCodPaid = async (orderId: string) => {
    try {
      await markCodPaid(orderId).unwrap();
      toast.success('COD payment marked as paid on server.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark COD payment as paid');
    }
  };

  // Open Refund Modal
  const handleOpenRefund = (t: any) => {
    setActiveTransaction(t);
    setRefundReason('Customer return / order cancelled');
    setShowRefundModal(true);
  };

  // Confirm Refund
  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTransaction) return;
    const ordId = activeTransaction.orderId;

    try {
      await processRefund({ orderId: ordId, reason: refundReason }).unwrap();
      toast.success('Refund processed successfully on server.');
      setShowRefundModal(false);
      setActiveTransaction(null);
      setRefundReason('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to process refund');
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transaction records to export');
      return;
    }
    const headers = ['Transaction ID', 'Order ID', 'Restaurant', 'Customer', 'Payment Method', 'Gross Amount', 'Platform Fee (10%)', 'Net Payout', 'Payment Status', 'Order Status', 'Date'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.orderId,
      `"${t.restaurantName.replace(/"/g, '""')}"`,
      `"${t.customerName.replace(/"/g, '""')}"`,
      t.paymentMethod,
      t.grossAmount.toFixed(2),
      t.commission.toFixed(2),
      t.netPayout.toFixed(2),
      t.paymentStatus,
      t.orderStatus,
      new Date(t.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `restaurant_payouts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payout report downloaded as CSV');
  };

  return (
    <div className="space-y-6">
            <PageHeader
              title="Payouts & Billing Management"
              subtitle="Monitor net store earnings, commission breakdowns, settled payments, and reconcile transactions across your restaurants."
              actions={
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportCSV}
                    className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>

                  <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    title="Live Refresh"
                  >
                    <RefreshCw className="w-4 h-4 text-[var(--primary-color)]" />
                    <span className="hidden sm:inline">Sync</span>
                  </button>
                </div>
              }
            />

            {/* Store Switcher Bar if multiple restaurants */}
            {restaurants.length > 1 && (
              <div className="flex items-center gap-3 bg-[var(--surface-color)] border border-[var(--border-color)] p-3 rounded-2xl">
                <Store className="w-4 h-4 text-amber-400 ml-2" />
                <span className="text-xs font-bold text-[var(--text-secondary)]">Store Scope:</span>
                <select
                  value={selectedRestId}
                  onChange={(e) => setSelectedRestId(e.target.value)}
                  className="bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value="ALL">All Stores ({restaurants.length})</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Gross Restaurant Sales"
                value={formatCurrency(metrics.grossSales)}
                sublabel={`${metrics.completedOrders} settled orders`}
                icon={DollarSign}
                trend="up"
                delta="+12.5%"
                accentColor="emerald"
              />
              <StatCard
                title="Net Store Payout (90%)"
                value={formatCurrency(metrics.netPayout)}
                sublabel="Ready for bank transfer"
                icon={TrendingUp}
                trend="up"
                delta="+10.2%"
                accentColor="emerald"
              />
              <StatCard
                title="Platform Fee (10%)"
                value={formatCurrency(metrics.platformFees)}
                sublabel="BiteRush service charge"
                icon={Percent}
                accentColor="rose"
              />
              <StatCard
                title="Pending COD Collection"
                value={formatCurrency(metrics.pendingCod)}
                sublabel="In transit by drivers"
                icon={Wallet}
                accentColor="amber"
              />
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Txn ID, customer, store..."
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
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI / Net Banking</option>
                  <option value="CASH_ON_DELIVERY">Cash On Delivery</option>
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

            {/* Transactions Table */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <h3 className="font-outfit font-bold text-base text-[var(--text-primary)]">
                    Settlement & Payout Transactions
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Showing {filteredTransactions.length} records matching current filters
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  90% Payout Rate
                </span>
              </div>

              {ordersLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={DollarSign}
                    title="No Payout Records Found"
                    description="When customers place orders at your restaurants, financial settlements and payment breakdowns will appear here."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="p-3.5">Txn / Order</th>
                        <th className="p-3.5">Store / Customer</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5 text-right">Gross Total</th>
                        <th className="p-3.5 text-right">Platform (10%)</th>
                        <th className="p-3.5 text-right">Net Payout</th>
                        <th className="p-3.5 text-center">Payment Status</th>
                        <th className="p-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] font-medium">
                      {filteredTransactions.map((t, idx) => {
                        const rowKey = t.orderId ? `owner-pay-${t.orderId}` : `${t.id}-${idx}`;

                        return (
                          <tr
                            key={rowKey}
                            className="hover:bg-[var(--background-color)]/40 transition-colors"
                          >
                            {/* Txn / Order */}
                            <td className="p-3.5">
                              <div className="font-mono font-bold text-[var(--primary-color)]">
                                {t.id}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                                #{String(t.orderId).slice(-8)}
                              </div>
                            </td>

                            {/* Store / Customer */}
                            <td className="p-3.5">
                              <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-[var(--primary-color)] shrink-0" />
                                <span>{t.restaurantName}</span>
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)]">
                                {t.customerName}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="p-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                              {formatDate(t.createdAt)}
                            </td>

                            {/* Method */}
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--background-color)] border border-[var(--border-color)] font-mono text-[11px] font-semibold">
                                {t.paymentMethod === 'CARD' && <CreditCard className="w-3 h-3 text-blue-400" />}
                                {t.paymentMethod === 'UPI' && <Wallet className="w-3 h-3 text-emerald-400" />}
                                {t.paymentMethod === 'CASH_ON_DELIVERY' && <DollarSign className="w-3 h-3 text-amber-400" />}
                                {t.paymentMethod.replace(/_/g, ' ')}
                              </span>
                            </td>

                            {/* Gross Amount */}
                            <td className="p-3.5 text-right font-bold font-mono text-[var(--text-primary)]">
                              {formatCurrency(t.grossAmount)}
                            </td>

                            {/* Platform Commission */}
                            <td className="p-3.5 text-right font-mono text-rose-400">
                              -{formatCurrency(t.commission)}
                            </td>

                            {/* Net Payout */}
                            <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                              {formatCurrency(t.netPayout)}
                            </td>

                            {/* Status */}
                            <td className="p-3.5 text-center">
                              <StatusBadge status={t.paymentStatus} type="payment" />
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/orders/${t.orderId}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--background-color)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--primary-color)] transition-colors"
                                  title="Inspect Order Details"
                                >
                                  <span>View</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </Link>

                                {t.paymentStatus === 'PENDING' && t.paymentMethod === 'CASH_ON_DELIVERY' && (
                                  <button
                                    onClick={() => handleMarkCodPaid(t.orderId)}
                                    disabled={isMarkingCod}
                                    className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-bold transition-all flex items-center gap-0.5"
                                    title="Mark COD as Paid"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Paid</span>
                                  </button>
                                )}

                                {['PAID', 'COMPLETED', 'SETTLED'].includes(t.paymentStatus) && t.paymentMethod !== 'CASH_ON_DELIVERY' && (
                                  <button
                                    onClick={() => handleOpenRefund(t)}
                                    className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 text-[11px] font-bold transition-all flex items-center gap-0.5"
                                    title="Issue Refund"
                                  >
                                    <RotateCcw className="w-3 h-3" />
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

        {/* Refund Modal */}
        {showRefundModal && activeTransaction && (
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
                You are issuing a refund of <strong className="text-[var(--text-primary)]">{formatCurrency(activeTransaction.grossAmount)}</strong> for Order #{String(activeTransaction.orderId).slice(-8)}.
              </p>

              <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] block mb-1">
                    Refund Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Food damaged in transit, customer complaint"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
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
  );
}
