'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useGetAllOrdersQuery } from '@/store/api/orderApi';
import { useMarkCodPaidMutation, useProcessRefundMutation } from '@/store/api/paymentApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [activeTxn, setActiveTxn] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data: ordersRes, isLoading, refetch } = useGetAllOrdersQuery({ page: 0, size: 150 });
  const [markCodPaid, { isLoading: isMarkingPaid }] = useMarkCodPaidMutation();
  const [processRefund, { isLoading: isRefunding }] = useProcessRefundMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    return [];
  };

  const orders = extractArray(ordersRes);

  const transactions = useMemo(() => {
    return orders.map((o: any, idx: number) => {
      const ordId = o.orderId || o.id || `ORD-ADM-${idx}`;
      const amount = Number(o.totalAmount || o.subtotal || 0);

      const pStatus = o.paymentStatus || (
        o.status === 'CANCELLED'
          ? 'REFUNDED'
          : o.paymentMethod === 'CASH_ON_DELIVERY' && o.status !== 'DELIVERED'
            ? 'PENDING'
            : 'PAID'
      );

      const txnId = o.paymentId || (ordId ? `TXN-${String(ordId).slice(-8).toUpperCase()}` : `TXN-ADM-${idx + 1000}`);

      return {
        id: txnId,
        orderId: ordId,
        customerName: o.userName || o.customerName || o.userEmail || 'Customer',
        restaurantName: o.restaurantName || 'Restaurant Partner',
        amount,
        paymentMethod: o.paymentMethod || 'CARD',
        status: pStatus,
        createdAt: o.createdAt || new Date().toISOString(),
      };
    });
  }, [orders]);

  const filteredTxns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return transactions.filter((t: any) => {
      const matchSearch =
        !term ||
        String(t.id).toLowerCase().includes(term) ||
        String(t.orderId).toLowerCase().includes(term) ||
        String(t.customerName).toLowerCase().includes(term) ||
        String(t.restaurantName).toLowerCase().includes(term);

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  const isPaid = (status: string) => ['PAID', 'COMPLETED', 'SETTLED', 'SUCCESS'].includes(status?.toUpperCase());

  const totalProcessed = transactions
    .filter((t: any) => isPaid(t.status))
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const totalRefunded = transactions
    .filter((t: any) => t.status === 'REFUNDED')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const completedCount = transactions.filter((t: any) => isPaid(t.status)).length;
  const pendingCodCount = transactions.filter((t: any) => t.status === 'PENDING').length;

  const handleMarkPaid = async (orderId: string) => {
    try {
      await markCodPaid(orderId).unwrap();
      toast.success('COD order marked as paid on server');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark COD order as paid');
    }
  };

  const handleOpenRefund = (t: any) => {
    setActiveTxn(t);
    setRefundReason('Customer requested refund');
    setShowRefundModal(true);
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTxn) return;
    const ordId = activeTxn.orderId;

    try {
      await processRefund({ orderId: ordId, reason: refundReason }).unwrap();
      toast.success('Refund processed successfully on server');
      setShowRefundModal(false);
      setActiveTxn(null);
      setRefundReason('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to process refund');
    }
  };

  return (
    <div className="space-y-6">
            <PageHeader
              title="Platform Payment Gateway & Billing"
              subtitle="Monitor platform revenue, payment reconciliation, settlement logs, and manage payment records."
              actions={
                <button
                  onClick={() => refetch()}
                  className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-rose-500 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Refresh</span>
                </button>
              }
            />

            {/* Platform KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Gross Revenue"
                value={formatCurrency(totalProcessed)}
                icon={Wallet}
                colorClass="text-emerald-400"
              />
              <StatCard
                title="Completed Payments"
                value={completedCount}
                icon={CheckCircle2}
                colorClass="text-[var(--primary-color)]"
              />
              <StatCard
                title="Pending / COD"
                value={pendingCodCount}
                icon={CreditCard}
                colorClass="text-amber-400"
              />
              <StatCard
                title="Total Refunded"
                value={formatCurrency(totalRefunded)}
                icon={RotateCcw}
                colorClass="text-rose-400"
              />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by order ID, Txn ref, customer, or store..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)] font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'PAID', 'PENDING', 'REFUNDED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      statusFilter === status
                        ? 'bg-[var(--primary-color)] text-white shadow-sm'
                        : 'bg-[var(--surface-color)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {status === 'ALL' ? 'All Transactions' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : filteredTxns.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No Transactions Found"
                description="Transactions will appear here once customers place orders and initiate payments."
              />
            ) : (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Customer & Store</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredTxns.map((t: any, idx: number) => {
                        const rowKey = t.orderId ? `admin-pay-${t.orderId}` : `${t.id}-${idx}`;

                        return (
                          <tr key={rowKey} className="hover:bg-[var(--background-color)]/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[var(--primary-color)]">
                              <div>{t.id}</div>
                              <div className="text-[11px] text-[var(--text-muted)] font-normal">
                                #{String(t.orderId).slice(-8)} • {formatDate(t.createdAt)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[var(--text-primary)]">{t.customerName}</p>
                              <p className="text-[11px] text-[var(--text-muted)]">{t.restaurantName}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                                {t.paymentMethod?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-sm text-[var(--text-primary)]">
                              {formatCurrency(t.amount)}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={t.status} type="payment" />
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/orders/${t.orderId}`}
                                  className="px-2 py-1 bg-[var(--background-color)] border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--primary-color)] rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                                  title="Inspect Order"
                                >
                                  <span>View</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </Link>

                                {t.status === 'PENDING' && t.paymentMethod === 'CASH_ON_DELIVERY' && (
                                  <button
                                    onClick={() => handleMarkPaid(t.orderId)}
                                    disabled={isMarkingPaid}
                                    className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                                    title="Mark COD Order as Paid"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Paid</span>
                                  </button>
                                )}

                                {isPaid(t.status) && (
                                  <button
                                    onClick={() => handleOpenRefund(t)}
                                    className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                                    title="Issue Customer Refund"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Refund</span>
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
              </div>
            )}

        {/* Refund Modal */}
        {showRefundModal && activeTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-400" />
                  <span>Process Refund</span>
                </h3>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Issue refund of <strong className="text-[var(--text-primary)]">{formatCurrency(activeTxn.amount)}</strong> for Order #{String(activeTxn.orderId).slice(-8)}.
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
                    placeholder="e.g. Order cancelled, dispute resolved"
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
