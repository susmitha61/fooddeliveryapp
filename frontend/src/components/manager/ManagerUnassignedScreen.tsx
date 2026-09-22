'use client';

import React from 'react';
import { ShieldAlert, RefreshCw, LogOut, Store, CheckCircle2, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ManagerUnassignedScreenProps {
  onRefresh?: () => void;
  pageTitle?: string;
}

export function ManagerUnassignedScreen({ onRefresh, pageTitle = 'Operational Dashboard' }: ManagerUnassignedScreenProps) {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // ignore
    }
    dispatch(logout());
    router.push('/login');
    toast.success('Logged out');
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 text-center animate-in fade-in zoom-in duration-200">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Account Pending Store Association
        </span>
        <h2 className="font-outfit text-3xl font-extrabold text-[var(--text-primary)]">
          No Associated Restaurant Found
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
          You are authenticated with the <span className="font-bold text-[var(--primary-color)]">MANAGER</span> role, but you are not yet assigned to any active restaurant. Access to <span className="font-semibold text-[var(--text-primary)]">{pageTitle}</span>, Support Tickets, Reports, Orders, and Menu Controls remains strictly locked until an association is established.
        </p>
      </div>

      {/* User Information Card */}
      {user && (
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl max-w-md mx-auto flex items-center justify-between text-left text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-[var(--text-primary)]">{user.name || user.email}</p>
              <p className="text-[var(--text-muted)] text-[11px]">{user.email}</p>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-[var(--background-color)] border border-[var(--border-color)] px-2 py-1 rounded-lg text-[var(--text-muted)]">
            ID: {user.id?.slice(-8) || 'N/A'}
          </span>
        </div>
      )}

      {/* Action Steps */}
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl max-w-lg mx-auto text-left space-y-3 shadow-sm">
        <h4 className="text-xs font-bold uppercase text-[var(--primary-color)] tracking-wider">
          How to get access:
        </h4>
        <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Contact your <strong>Restaurant Owner</strong> or an <strong>Administrator</strong>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Request them to assign your account (<code className="text-amber-400 text-[11px]">{user?.email}</code>) to your restaurant using their <strong>Restaurant Management</strong> portal.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Once assigned, click <strong>Refresh Status</strong> below to automatically unlock operations.</span>
          </li>
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Status</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] hover:border-rose-500/40 text-xs font-bold text-rose-400 rounded-xl flex items-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Account</span>
        </button>
      </div>
    </div>
  );
}
