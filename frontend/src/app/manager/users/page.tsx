'use client';

import React, { useState } from 'react';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { Users, Search, RefreshCw, Mail, Phone, Shield } from 'lucide-react';

const ROLES = ['ALL', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'];

export default function ManagerUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const { data: usersRes, isLoading, refetch } = useGetAllUsersQuery({ page: 0, size: 50 });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const usersList = extractArray(usersRes);

  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(u.id || u.userId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalCount = usersList.length;
  const customersCount = usersList.filter((u) => u.role === 'CUSTOMER').length;
  const driversCount = usersList.filter((u) => u.role === 'DELIVERY_DRIVER').length;
  const ownersCount = usersList.filter((u) => u.role === 'RESTAURANT_OWNER').length;

  return (
    <div className="space-y-6">
            <PageHeader
              title="Platform Users Oversight"
              subtitle="View registered customers, drivers, and restaurant staff."
              actions={
                <button
                  onClick={() => refetch()}
                  className="px-3.5 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  title="Refresh User List"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                  <span>Refresh</span>
                </button>
              }
            />

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={totalCount} icon={Users} trend="Registered accounts" />
              <StatCard title="Customers" value={customersCount} icon={Users} colorClass="text-sky-400" />
              <StatCard title="Drivers" value={driversCount} icon={Shield} colorClass="text-emerald-400" />
              <StatCard title="Store Owners" value={ownersCount} icon={Shield} colorClass="text-amber-400" />
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      roleFilter === r
                        ? 'bg-[var(--primary-color)] text-white shadow-md'
                        : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {r.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* User List */}
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Users Found"
                description={
                  searchTerm || roleFilter !== 'ALL'
                    ? 'Try adjusting your search query or filter criteria.'
                    : 'No users registered on the platform yet.'
                }
              />
            ) : (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--background-color)]/50 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4">User ID</th>
                        <th className="py-3.5 px-4 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredUsers.map((u: any) => {
                        const uid = u.id || u.userId || '';
                        const name = u.name || u.username || 'Anonymous User';
                        const initials = name
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={uid} className="hover:bg-[var(--background-color)]/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold text-xs shrink-0">
                                  {initials || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-[var(--text-primary)]">{name}</p>
                                  <p className="text-[11px] text-[var(--text-muted)]">Active Account</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                              <div className="flex items-center gap-1.5 text-xs">
                                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                <span>{u.email}</span>
                              </div>
                              {u.phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                              #{String(uid).slice(-8)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <StatusBadge status={u.role} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
    </div>
  );
}
