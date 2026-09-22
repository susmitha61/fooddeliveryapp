'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store';
import { useGetMyPaymentsQuery } from '@/store/api/paymentApi';
import { useGetMyOrdersQuery } from '@/store/api/orderApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  ExternalLink,
  Receipt,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role || 'CUSTOMER';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const {
    data: paymentsRes,
    isLoading: isPaymentsLoading,
    refetch: refetchPayments,
  } = useGetMyPaymentsQuery({ page: 0, size: 50 });

  const { data: ordersRes } = useGetMyOrdersQuery({ page: 0, size: 50 });

  // Extract payments array, fallback to orders if payments API is empty
  const rawPayments: any[] = (() => {
    if (paymentsRes?.data?.content && Array.isArray(paymentsRes.data.content)) {
      return paymentsRes.data.content;
    }
    if (Array.isArray(paymentsRes?.data)) {
      return paymentsRes.data;
    }
    return [];
  })();

  // Fallback synthesis from orders if payment service has no stored records
  const ordersList: any[] = (() => {
    if (ordersRes?.data?.content && Array.isArray(ordersRes.data.content)) {
      return ordersRes.data.content;
    }
    if (Array.isArray(ordersRes?.data)) {
      return ordersRes.data;
    }
    return [];
  })();

  const payments = rawPayments.length > 0
    ? rawPayments
    : ordersList.map((o, idx) => ({
        id: o.paymentId || (o.orderId || o.id ? `PAY-${String(o.orderId || o.id).slice(-8)}` : `PAY-${idx}`),
        orderId: o.orderId || o.id,
        amount: Number(o.totalAmount || o.subtotal || 0),
        paymentMethod: o.paymentMethod || 'CARD',
        status: o.paymentStatus || (o.status === 'CANCELLED' ? 'REFUNDED' : o.paymentMethod === 'CASH_ON_DELIVERY' && o.status !== 'DELIVERED' ? 'PENDING' : 'PAID'),
        transactionRef: o.paymentId || `TXN_${String(o.orderId || o.id || '').slice(-6)}`,
        createdAt: o.createdAt || new Date().toISOString(),
      }));

  const filteredPayments = payments.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      String(p.id || '').toLowerCase().includes(term) ||
      String(p.orderId || '').toLowerCase().includes(term) ||
      String(p.transactionRef || '').toLowerCase().includes(term);

    const matchStatus =
      statusFilter === 'ALL' ||
      String(p.status).toUpperCase() === statusFilter;

    return matchSearch && matchStatus;
  });

  const isPaid = (s: string) => ['PAID', 'COMPLETED', 'SUCCESS', 'SETTLED'].includes(String(s || '').toUpperCase());

  const totalSpent = payments
    .filter((p: any) => isPaid(p.status))
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const completedCount = payments.filter((p: any) => isPaid(p.status)).length;
  const pendingCount = payments.filter((p: any) => String(p.status).toUpperCase() === 'PENDING').length;
  const refundCount = payments.filter((p: any) => String(p.status).toUpperCase() === 'REFUNDED').length;

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={role} />

          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
            <PageHeader
              title="Payment & Billing History"
              subtitle="Review your past transactions, payment methods, and invoices."
            />

            {/* KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Paid"
                value={formatCurrency(totalSpent)}
                icon={Wallet}
                colorClass="text-[var(--primary-color)]"
              />
              <StatCard
                title="Completed"
                value={completedCount}
                icon={CheckCircle2}
                colorClass="text-emerald-400"
              />
              <StatCard
                title="Pending / COD"
                value={pendingCount}
                icon={Receipt}
                colorClass="text-amber-400"
              />
              <StatCard
                title="Refunds"
                value={refundCount}
                icon={RotateCcw}
                colorClass="text-sky-400"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by order ID or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      statusFilter === st
                        ? 'bg-[var(--primary-color)] text-white shadow-md'
                        : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Table / List */}
            {isPaymentsLoading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No Transactions Found"
                description={
                  searchTerm || statusFilter !== 'ALL'
                    ? 'No payments match your search or filter criteria.'
                    : 'You have not made any payments yet. Place your first order to get started.'
                }
              />
            ) : (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Transaction / Order</th>
                        <th className="py-3.5 px-4">Payment Method</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Receipt / Tracking</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredPayments.map((p: any, idx: number) => {
                        const orderId = p.orderId || '';
                        const txRef = p.transactionRef || p.id || 'N/A';
                        const method = p.paymentMethod || 'CARD';
                        const rowKey = p.orderId ? `cust-pay-${p.orderId}` : `${p.id || 'pay'}-${idx}`;

                        return (
                          <tr key={rowKey} className="hover:bg-[var(--background-color)]/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center shrink-0">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-[var(--text-primary)] font-mono">
                                    #{String(txRef).slice(-10)}
                                  </p>
                                  {orderId && (
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                      Order #{String(orderId).slice(-8)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                                {method.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[var(--text-muted)]">
                              {p.createdAt ? formatDate(p.createdAt) : '—'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-sm text-[var(--text-primary)]">
                              {formatCurrency(Number(p.amount) || 0)}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={p.status || 'PAID'} type="payment" />
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {orderId && (
                                <Link
                                  href={`/orders/${orderId}`}
                                  className="inline-flex items-center gap-1 text-[var(--primary-color)] hover:underline font-bold text-xs"
                                >
                                  <span>View Order</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
