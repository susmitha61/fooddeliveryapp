'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('BiteRush Application Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-6 shadow-xl">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="font-outfit font-black text-3xl sm:text-4xl tracking-tight text-[var(--text-primary)] mb-2">
        Something Went Wrong
      </h1>

      <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mb-2 leading-relaxed">
        An unexpected error occurred while loading this view.
      </p>

      {error?.message && (
        <div className="max-w-md p-3 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-mono text-rose-400 mb-8 break-all">
          {error.message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <Link
          href={ROUTES.HOME}
          className="px-6 py-3 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-bold text-[var(--text-primary)] rounded-xl transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4 text-[var(--primary-color)]" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
