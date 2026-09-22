'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useGetAllOrdersQuery } from '@/store/api/orderApi';
import { useGetAllTicketsQuery } from '@/store/api/supportApi';
import { useGetRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { formatCurrency } from '@/lib/utils';
import { BarChart2, TrendingUp, DollarSign, ShoppingBag, MessageSquare, Store, Users } from 'lucide-react';

export default function AdminReportsPage() {
  const { data: ordersRes } = useGetAllOrdersQuery({ page: 0, size: 100 });
  const { data: ticketsRes } = useGetAllTicketsQuery({ page: 0, size: 100 });
  const { data: restaurantsRes } = useGetRestaurantsQuery({ page: 0, size: 100 });
  const { data: usersRes } = useGetAllUsersQuery({ page: 0, size: 100 });

  const orders: any[] = Array.isArray(ordersRes?.data) ? ordersRes?.data : Array.isArray(ordersRes?.data?.content) ? ordersRes?.data?.content : [];
  const tickets: any[] = Array.isArray(ticketsRes?.data) ? ticketsRes?.data : Array.isArray(ticketsRes?.data?.content) ? ticketsRes?.data?.content : [];
  const restaurants: any[] = Array.isArray(restaurantsRes?.data) ? restaurantsRes?.data : Array.isArray(restaurantsRes?.data?.content) ? restaurantsRes?.data?.content : [];
  const users: any[] = Array.isArray(usersRes?.data) ? usersRes?.data : Array.isArray(usersRes?.data?.content) ? usersRes?.data?.content : [];

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';
  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const openRestaurants = restaurants.filter(r => r.isOpen !== false).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin System Telemetry & Reports"
        subtitle="Platform-wide financial metrics, user growth, order volumes, and system-wide support metrics."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Gross Revenue"
          value={formatCurrency(totalRevenue)}
          accentColor="emerald"
        />
        <StatCard
          icon={Users}
          title="Registered Users"
          value={users.length}
          accentColor="sky"
        />
        <StatCard
          icon={ShoppingBag}
          title="System Orders"
          value={totalOrders}
          accentColor="orange"
        />
        <StatCard
          icon={MessageSquare}
          title="Open Support Tickets"
          value={openTickets}
          accentColor="rose"
        />
      </div>

            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl space-y-4">
              <h2 className="font-outfit font-bold text-lg flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[var(--primary-color)]" />
                <span>Executive Platform Metrics</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Active Stores</span>
                    <span className="text-emerald-400">{openRestaurants} / {restaurants.length}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-color)] overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${restaurants.length > 0 ? (openRestaurants / restaurants.length) * 100 : 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Average Basket Size</span>
                    <span className="text-amber-400">${avgOrderValue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-color)] overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            </div>
    </div>
  );
}
