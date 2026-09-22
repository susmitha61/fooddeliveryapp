'use client';

import React, { useState } from 'react';
import {
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
} from '@/store/api/supportApi';
import { useAppSelector } from '@/store';
import {
  useGetRestaurantsQuery,
  useGetMyRestaurantsQuery,
} from '@/store/api/restaurantApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Store, MessageSquare,
  BarChart2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { ManagerStoreSwitcher } from '@/components/manager/ManagerStoreSwitcher';
import { LoadingSpinner } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.content)) return res.data.content;
  if (Array.isArray(res.content)) return res.content;
  return [];
};

export default function ManagerDashboardPage() {
  const [ticketStatusFilter, setTicketStatusFilter] = useState('OPEN');
  const [selectedRestId, setSelectedRestId] = useState('');
  const { user } = useAppSelector(s => s.auth);
  const isManager = user?.role === 'MANAGER';

  // For Manager: fetch assigned restaurants from /my-restaurants
  const { data: myRestaurantsRes, isLoading: myRestsLoading, refetch: refetchMy } = useGetMyRestaurantsQuery();
  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  // Selected restaurant
  const currentRestaurantId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  // Only fetch tickets if user has assigned restaurant (or is Admin)
  const { data: ticketsRes, isLoading: ticketsLoading, refetch: refetchTickets } = useGetAllTicketsQuery(
    { status: ticketStatusFilter || undefined, page: 0, size: 50 },
    { skip: isManager && !hasAssociatedRestaurant }
  );

  const [updateTicket] = useUpdateTicketMutation();

  const rawTickets: any[] = extractArray(ticketsRes);
  // Strictly filter tickets for the manager's assigned restaurant(s)
  const tickets = isManager
    ? rawTickets.filter(t => t.restaurantId && myRestaurants.some(r => r.id === t.restaurantId))
    : rawTickets;

  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const urgentTickets = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const activeRestaurants = myRestaurants.filter((r) => r.isOpen).length;

  const handleUpdateTicket = async (ticketId: string, data: any) => {
    try {
      await updateTicket({ ticketId, ...data }).unwrap();
      toast.success('Ticket status updated');
      refetchTickets();
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Overview"
        subtitle="Monitor assigned store operations, resolve store tickets, and track live restaurant health."
      />

      {/* Loading state before unassigned check */}
      {isManager && myRestsLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
        </div>
      ) : isManager && !hasAssociatedRestaurant ? (
        <ManagerUnassignedScreen onRefresh={refetchMy} pageTitle="Manager Overview" />
      ) : (
        <>
          {/* Store Switcher for Assigned Stores */}
          {isManager && myRestaurants.length > 0 && (
            <ManagerStoreSwitcher
              restaurants={myRestaurants}
              selectedRestaurantId={currentRestaurantId}
              onSelectRestaurantId={setSelectedRestId}
            />
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MessageSquare}
              title="Assigned Open Tickets"
              value={openTickets}
              accentColor="sky"
            />
            <StatCard
              icon={AlertCircle}
              title="Urgent Store Issues"
              value={urgentTickets}
              accentColor="rose"
            />
            <StatCard
              icon={Store}
              title="Active Assigned Stores"
              value={activeRestaurants}
              accentColor="emerald"
            />
            <StatCard
              icon={BarChart2}
              title="Total Stores Managed"
              value={myRestaurants.length}
              accentColor="orange"
            />
          </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Support Tickets Scoped to Assigned Stores */}
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                      <div>
                        <h3 className="font-outfit font-bold">Assigned Store Tickets</h3>
                        <p className="text-[11px] text-[var(--text-muted)]">Tickets related to your assigned stores</p>
                      </div>
                      <select
                        className="text-xs px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-lg outline-none"
                        value={ticketStatusFilter}
                        onChange={e => setTicketStatusFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {ticketsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[var(--border-color)] rounded-xl animate-pulse" />)}
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="p-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-secondary)]">No active tickets for assigned stores!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border-color)] max-h-96 overflow-y-auto">
                        {tickets.map((ticket) => (
                          <div key={ticket.id || ticket.ticketId} className="p-4 hover:bg-[var(--background-color)] transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                              <div>
                                <span className="font-mono text-xs font-bold text-[var(--primary-color)] mr-2">
                                  {ticket.ticketNumber || ticket.ticketId?.slice(-8)}
                                </span>
                                <StatusBadge status={ticket.status} type="ticket" />
                              </div>
                              <div className="flex gap-1.5">
                                <select
                                  className="text-[11px] px-2 py-1 bg-[var(--background-color)] border border-[var(--border-color)] rounded-lg outline-none"
                                  value={ticket.status}
                                  onChange={e => handleUpdateTicket(ticket.id || ticket.ticketId, { status: e.target.value })}
                                >
                                  {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <p className="text-sm font-semibold truncate">{ticket.subject}</p>
                            <p className="text-xs text-[var(--text-muted)]">{ticket.userName} · {ticket.category?.replace(/_/g, ' ')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Restaurants Only */}
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                      <div>
                        <h3 className="font-outfit font-bold">Assigned Stores ({myRestaurants.length})</h3>
                        <p className="text-[11px] text-[var(--text-muted)]">{activeRestaurants} currently open</p>
                      </div>
                    </div>
                    {myRestsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-14 bg-[var(--border-color)] rounded-xl animate-pulse" />)}
                      </div>
                    ) : myRestaurants.length === 0 ? (
                      <div className="p-8 text-center">
                        <Store className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-secondary)]">No assigned restaurants.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border-color)] max-h-96 overflow-y-auto">
                        {myRestaurants.map((r) => (
                          <div key={r.id} className="p-4 hover:bg-[var(--background-color)] transition-colors flex items-center gap-3">
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt={r.name}
                                className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)] shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold shrink-0">
                                <Store className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{r.name}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{r.cuisineType} · {r.city}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${r.isOpen ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>
                                {r.isOpen ? 'Open' : 'Closed'}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${r.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
    </div>
  );
}
