'use client';

import React, { useState } from 'react';
import { useGetAllUsersQuery, useUpdateUserRoleMutation } from '@/store/api/userApi';
import { useGetRestaurantsQuery, useChangeRestaurantStatusMutation } from '@/store/api/restaurantApi';
import { useGetAllTicketsQuery } from '@/store/api/supportApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';
import {
  Users, Store, MessageSquare, ShieldCheck, BarChart2,
  AlertCircle, CheckCircle2, Clock, Ban, Search, Truck, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['GUEST', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'];

export default function AdminDashboardPage() {
  const [userSearch, setUserSearch] = useState('');
  const [restTab, setRestTab] = useState<'ALL' | 'PENDING'>('PENDING');

  const { data: usersRes, isLoading: usersLoading } = useGetAllUsersQuery({ page: 0, size: 100 });
  const { data: restaurantsRes, isLoading: restsLoading } = useGetRestaurantsQuery({ page: 0, size: 100 });
  const { data: ticketsRes } = useGetAllTicketsQuery({ status: 'OPEN', page: 0, size: 50 });

  const [updateRole] = useUpdateUserRoleMutation();
  const [changeRestStatus] = useChangeRestaurantStatusMutation();

  const users: any[] = usersRes?.data?.content || usersRes?.data || [];
  const restaurants: any[] = restaurantsRes?.data?.content || [];
  const openTickets: any[] = ticketsRes?.data?.content || ticketsRes?.data || [];

  const filteredUsers = users.filter(u =>
    !userSearch ||
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRestaurants = restTab === 'PENDING'
    ? restaurants.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING')
    : restaurants;

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateRole({ userId, role }).unwrap();
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update role');
    }
  };

  const handleRestStatus = async (id: string, status: string) => {
    try {
      await changeRestStatus({ id, status }).unwrap();
      toast.success(`Restaurant ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const pendingCount = restaurants.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Control Panel"
        subtitle="Full system access — users, restaurants, orders, tickets."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/drivers"
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-emerald-500 transition-all"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" /> Courier Fleet
            </Link>
            <Link
              href="/admin/managers"
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-sky-500 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" /> Manager Fleet
            </Link>
            <Link
              href="/admin/reviews"
              className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-rose-400 transition-all"
            >
              <Star className="w-3.5 h-3.5 text-rose-400" /> Customer Reviews
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          accentColor="orange"
          sublabel="Registered accounts"
        />
        <StatCard
          title="Pending Approval"
          value={pendingCount}
          icon={Clock}
          accentColor="amber"
          sublabel="Stores awaiting review"
        />
        <StatCard
          title="Open Tickets"
          value={openTickets.length}
          icon={MessageSquare}
          accentColor="sky"
          sublabel="Customer inquiries"
        />
        <StatCard
          title="Total Restaurants"
          value={restaurants.length}
          icon={Store}
          accentColor="emerald"
          sublabel="Active & onboarding partners"
        />
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Management */}
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <h3 className="font-outfit font-bold mb-3">User Management</h3>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl">
                    <Search className="w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      className="flex-1 bg-transparent text-sm outline-none"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search by name or email..."
                    />
                  </div>
                </div>
                {usersLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[var(--border-color)] rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)] max-h-96 overflow-y-auto">
                    {filteredUsers.map((u: any) => (
                      <div key={u.id || u.userId} className="p-3 hover:bg-[var(--background-color)] transition-colors flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-color)]/20 to-[var(--primary-color)] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {(u.name || u.username || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{u.name || u.username || '—'}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{u.email}</p>
                        </div>
                        <select
                          className="text-[11px] px-2 py-1 bg-[var(--background-color)] border border-[var(--border-color)] rounded-lg outline-none shrink-0"
                          defaultValue={u.role}
                          onChange={e => handleRoleChange(u.id || u.userId, e.target.value)}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <EmptyState
                        icon={Users}
                        title="No Users Found"
                        description="Try adjusting your search criteria."
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Restaurant Approval */}
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-outfit font-bold">Restaurant Approval</h3>
                    {pendingCount > 0 && (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {pendingCount} pending
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(['PENDING', 'ALL'] as const).map(tab => (
                      <button key={tab} onClick={() => setRestTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${restTab === tab ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                        {tab === 'PENDING' ? `Pending (${pendingCount})` : `All (${restaurants.length})`}
                      </button>
                    ))}
                  </div>
                </div>
                {restsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-[var(--border-color)] rounded-xl animate-pulse" />)}
                  </div>
                ) : filteredRestaurants.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title={restTab === 'PENDING' ? 'No Pending Approvals' : 'No Restaurants Found'}
                    description={restTab === 'PENDING' ? 'All submitted restaurant applications have been reviewed.' : 'No stores registered yet.'}
                  />
                ) : (
                  <div className="divide-y divide-[var(--border-color)] max-h-96 overflow-y-auto">
                    {filteredRestaurants.map((r: any) => (
                      <div key={r.id} className="p-3 hover:bg-[var(--background-color)] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          {r.imageUrl && (
                            <img src={r.imageUrl} alt={r.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)] shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{r.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {r.cuisineType} · {[r.area, r.city].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border shrink-0 ${
                            r.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : r.status === 'SUSPENDED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {r.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleRestStatus(r.id, 'ACTIVE')}
                              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                          )}
                          {r.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleRestStatus(r.id, 'SUSPENDED')}
                              className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
    </div>
  );
}
