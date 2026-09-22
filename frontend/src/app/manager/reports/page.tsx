'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetRestaurantOrdersQuery } from '@/store/api/orderApi';
import { useGetAllTicketsQuery } from '@/store/api/supportApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/utils';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { ManagerStoreSwitcher } from '@/components/manager/ManagerStoreSwitcher';
import { LoadingSpinner } from '@/components/ui/Modal';
import { BarChart2, TrendingUp, DollarSign, ShoppingBag, MessageSquare, Store, CheckCircle2 } from 'lucide-react';

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.content)) return res.data.content;
  if (Array.isArray(res.content)) return res.content;
  return [];
};

export default function ManagerReportsPage() {
  const [selectedRestId, setSelectedRestId] = useState('');
  const { user } = useAppSelector(s => s.auth);
  const isManager = user?.role === 'MANAGER';

  // Fetch assigned restaurants
  const { data: myRestaurantsRes, isLoading: myRestsLoading, refetch: refetchMyRests } = useGetMyRestaurantsQuery();
  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  const currentRestaurantId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  useEffect(() => {
    if (myRestaurants.length > 0 && !selectedRestId) {
      setSelectedRestId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedRestId]);

  // Query orders strictly for the selected assigned restaurant
  const { data: ordersRes } = useGetRestaurantOrdersQuery(
    { restaurantId: currentRestaurantId, page: 0, size: 100 },
    { skip: !currentRestaurantId || !hasAssociatedRestaurant }
  );

  // Query tickets strictly if assigned
  const { data: ticketsRes } = useGetAllTicketsQuery(
    { page: 0, size: 100 },
    { skip: !hasAssociatedRestaurant }
  );


  const rawOrders = extractArray(ordersRes);
  const rawTickets = extractArray(ticketsRes);

  // Filter tickets strictly for the selected restaurant
  const tickets = rawTickets.filter(t => t.restaurantId === currentRestaurantId);

  const totalOrders = rawOrders.length;
  const totalRevenue = rawOrders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';
  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  const currentRest = myRestaurants.find(r => r.id === currentRestaurantId);

  return (
    <div className="space-y-6">
      {/* Loading state before unassigned check */}
      {isManager && myRestsLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
        </div>
      ) : isManager && !hasAssociatedRestaurant ? (
        <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Manager Analytics & Reports" />
      ) : (
        <>
          {/* Store Switcher for Assigned Stores */}
          {myRestaurants.length > 0 && (
            <ManagerStoreSwitcher
              restaurants={myRestaurants}
              selectedRestaurantId={currentRestaurantId}
              onSelectRestaurantId={setSelectedRestId}
            />
          )}

          <PageHeader
            title="Store Analytics & Performance"
            subtitle={`Performance metrics, processed revenue, and ticket resolution rates for ${currentRest?.name || 'assigned restaurant'}.`}
          />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              title="Store Revenue"
              value={formatCurrency(totalRevenue)}
              accentColor="emerald"
            />
            <StatCard
              icon={ShoppingBag}
              title="Orders Processed"
              value={totalOrders}
              accentColor="orange"
            />
            <StatCard
              icon={TrendingUp}
              title="Avg Order Value"
              value={`$${avgOrderValue}`}
              accentColor="sky"
            />
            <StatCard
              icon={MessageSquare}
              title="Open Store Tickets"
              value={openTickets}
              accentColor="rose"
            />
          </div>

                {/* Operational Health */}
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl space-y-4 shadow-sm">
                  <h2 className="font-outfit font-bold text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[var(--primary-color)]" />
                    <span>Store Operational Health</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Current Store Availability</span>
                        <span className={currentRest?.isOpen ? 'text-emerald-400' : 'text-rose-400'}>
                          {currentRest?.isOpen ? '● OPEN FOR ORDERS' : '○ CURRENTLY CLOSED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {currentRest?.openingTime && currentRest?.closingTime ? `Hours: ${currentRest.openingTime} - ${currentRest.closingTime}` : '24/7 Hours'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Ticket Resolution Rate</span>
                        <span className="text-[var(--primary-color)]">
                          {tickets.length > 0 ? (((tickets.length - openTickets) / tickets.length) * 100).toFixed(0) : 100}% Resolved
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--surface-color)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary-color)] rounded-full"
                          style={{ width: `${tickets.length > 0 ? (((tickets.length - openTickets) / tickets.length) * 100) : 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
    </div>
  );
}
