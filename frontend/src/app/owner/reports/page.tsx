'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetRestaurantOrdersQuery } from '@/store/api/orderApi';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from 'lucide-react';

export default function OwnerReportsPage() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  
  const { data: myRestaurantsRes, isLoading: restsLoading } = useGetMyRestaurantsQuery();
  const restaurants = myRestaurantsRes?.data || [];

  React.useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const { data: ordersRes, isLoading: ordersLoading } = useGetRestaurantOrdersQuery(
    { restaurantId: selectedRestaurantId, page: 0, size: 100 },
    { skip: !selectedRestaurantId }
  );

  const orders = ordersRes?.data?.content || [];
  
  // Calculate analytics
  const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED');
  const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED');
  const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  
  // Mock monthly data for chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const mockRevenue = [1200, 1900, 1500, 2200, 2800, totalRevenue > 0 ? totalRevenue : 3200];
  const maxRev = Math.max(...mockRevenue, 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Track your restaurant's performance and sales data."
        actions={
          restaurants.length > 0 ? (
            <select 
              className="px-4 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary-color)]"
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
            >
              {restaurants.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          accentColor="emerald"
          delta="+12.5%"
          trend="up"
        />
        <StatCard
          icon={Package}
          title="Delivered Orders"
          value={deliveredOrders.length}
          accentColor="orange"
          delta="+8.2%"
          trend="up"
        />
        <StatCard
          icon={Package}
          title="Cancelled Orders"
          value={cancelledOrders.length}
          accentColor="rose"
          delta="-2.4%"
          trend="down"
        />
        <StatCard
          icon={TrendingUp}
          title="Fulfillment Rate"
          value={`${orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 100}%`}
          accentColor="sky"
          delta="+4.1%"
          trend="up"
        />
      </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-outfit font-bold text-lg">Revenue Overview</h3>
                  <button className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">
                    <Calendar className="w-4 h-4" /> Last 6 Months
                  </button>
                </div>
                
                {/* CSS Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-2 pt-6">
                  {mockRevenue.map((rev, i) => (
                    <div key={i} className="relative flex-1 flex flex-col justify-end items-center group">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-bold px-2 py-1 rounded">
                        {formatCurrency(rev)}
                      </div>
                      
                      <div 
                        className="w-full max-w-[48px] bg-gradient-to-t from-[var(--primary-color)]/20 to-[var(--primary-color)] rounded-t-lg transition-all duration-500 hover:opacity-80"
                        style={{ height: `${(rev / maxRev) * 100}%`, minHeight: '4px' }}
                      />
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] mt-2">{months[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                <h3 className="font-outfit font-bold text-lg mb-6">Recent Transactions</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order: any) => (
                    <div key={order.orderId || order.id} className="flex justify-between items-center pb-4 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold truncate max-w-[120px]">{order.deliveryAddress}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[var(--primary-color)]">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">{order.status}</p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] text-center py-10">No recent transactions</p>
                  )}
                </div>
              </div>
            </div>
    </div>
  );
}
