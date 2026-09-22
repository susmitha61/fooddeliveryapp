'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store';
import { getNavItemsForRole } from './CustomerSidebar';
import { X, Zap } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('toggle-mobile-nav', handleToggle);
    window.addEventListener('close-mobile-nav', handleClose);

    return () => {
      window.removeEventListener('toggle-mobile-nav', handleToggle);
      window.removeEventListener('close-mobile-nav', handleClose);
    };
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Body scroll lock and Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const { label, accentClass, items } = getNavItemsForRole(user?.role);

  return (
    <div
      className="fixed inset-0 z-50 md:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-in Drawer */}
      <div className="relative w-72 max-w-[80vw] bg-[var(--surface-color)] border-r border-[var(--border-color)] h-full flex flex-col p-5 shadow-2xl z-10 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
          <Link href={ROUTES.HOME} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary-color)] to-amber-400 text-white flex items-center justify-center font-black text-base shadow-md">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-outfit font-extrabold text-lg text-[var(--text-primary)]">
              BiteRush
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-color)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        <span className={`px-3 text-[10px] font-extrabold uppercase tracking-widest ${accentClass} block mb-3`}>
          {label}
        </span>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isExact = pathname === item.href;
            const isNested = item.href !== '/' && pathname.startsWith(item.href + '/');
            const isActive = isExact || isNested;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--primary-color)] text-white shadow-md shadow-[var(--primary-color)]/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-color)]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
