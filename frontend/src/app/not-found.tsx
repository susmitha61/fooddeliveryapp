'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Home, Search, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center">
      {/* Brand Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] to-amber-400 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-[var(--primary-color)]/20 mb-6 animate-bounce">
        <Zap className="w-8 h-8 fill-current" />
      </div>

      <h1 className="font-outfit font-black text-6xl sm:text-7xl tracking-tight text-[var(--text-primary)] mb-3">
        404
      </h1>

      <h2 className="font-outfit font-bold text-xl sm:text-2xl text-[var(--text-primary)] mb-2">
        Meal Not Found on the Menu
      </h2>

      <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let&apos;s get you back on track!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={ROUTES.HOME}
          className="px-6 py-3 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Link
          href={ROUTES.BROWSE}
          className="px-6 py-3 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-bold text-[var(--text-primary)] rounded-xl transition-all flex items-center gap-2"
        >
          <Search className="w-4 h-4 text-[var(--primary-color)]" />
          <span>Browse Restaurants</span>
        </Link>
      </div>
    </div>
  );
}
