'use client';

import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useActiveSessionsQuery, useToggleActiveMutation } from '@/store/api/authApi';
import {
  ShieldCheck, ShieldAlert, Laptop,
  Clock, LogOut, Search, RefreshCw, KeyRound, Info, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSessionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sessionsRes, isLoading, refetch } = useActiveSessionsQuery(undefined, {
    pollingInterval: 15000,
  });
  const [toggleActive, { isLoading: isToggling }] = useToggleActiveMutation();

  const sessions: any[] = Array.isArray(sessionsRes?.data) ? sessionsRes.data : [];

  const filteredSessions = sessions.filter((u: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term) ||
      String(u.id || '').toLowerCase().includes(term)
    );
  });

  const handleTerminateSession = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke the active session and deactivate the account for ${userName}?`)) return;
    try {
      await toggleActive(userId).unwrap();
      toast.success(`Session for ${userName} terminated and account deactivated.`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to revoke session on server.');
    }
  };

  const activeCount = sessions.filter((s) => s.isLoggedIn && s.isActive !== false).length;
  const deactivatedCount = sessions.filter((s) => s.isActive === false).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Sessions & Security Governance"
        subtitle="Live server-tracked active user sessions with real-time token invalidation and account governance."
        actions={
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-rose-500 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Refresh Sessions"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Security Governance Notice */}
      <div className="bg-[var(--surface-color)] border border-blue-500/20 bg-blue-500/5 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Server-Truth Session Governance:</strong> Active sessions are retrieved directly from the Authentication Microservice. Terminating a session revokes the user's active token and deactivates their account on the backend database.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={ShieldCheck}
          title="Active Server Sessions"
          value={sessions.length}
          accentColor="emerald"
        />
        <StatCard
          icon={KeyRound}
          title="Active Authenticated Users"
          value={activeCount}
          accentColor="sky"
        />
        <StatCard
          icon={ShieldAlert}
          title="Deactivated Accounts"
          value={deactivatedCount}
          accentColor="rose"
        />
      </div>

      {/* Filter */}
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter sessions by user name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
          />
        </div>

        <span className="text-xs font-bold text-[var(--text-secondary)]">
          Showing {filteredSessions.length} sessions
        </span>
      </div>

      {/* Sessions Table / Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]">
          <ShieldCheck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="font-outfit font-bold text-lg">No Active Sessions Found</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No users currently have active logged-in sessions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((u: any) => {
            const id = u.id;
            const isActive = u.isActive !== false;
            const isLoggedIn = u.isLoggedIn !== false;

            return (
              <div
                key={id}
                className={`bg-[var(--surface-color)] border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  !isActive
                    ? 'border-rose-500/30 opacity-60 bg-rose-950/10'
                    : 'border-[var(--border-color)] hover:border-rose-500/40'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] flex items-center justify-center text-[var(--primary-color)] font-bold text-sm shrink-0">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {u.name || 'User'}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)] uppercase">
                        {u.role || 'CUSTOMER'}
                      </span>
                      {!isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Deactivated
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Active Session
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                    {u.lastLoginAt && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last login: {new Date(u.lastLoginAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1 justify-end">
                      <Laptop className="w-3 h-3 text-[var(--text-muted)]" /> Web App Session
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      ID: #{String(id).slice(-8)}
                    </p>
                  </div>

                  {isActive ? (
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleTerminateSession(id, u.name || u.email)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Revoke Session</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold"
                    >
                      Revoked
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
