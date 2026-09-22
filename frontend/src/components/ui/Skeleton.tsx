'use client';

import React from 'react';

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 animate-pulse ${className}`}
    >
      <div className="h-4 bg-[var(--background-color)] rounded-lg w-2/3" />
      <div className="h-3 bg-[var(--background-color)] rounded-lg w-1/2" />
      <div className="h-8 bg-[var(--background-color)] rounded-xl w-full mt-4" />
    </div>
  );
}

export function SkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl animate-pulse flex items-center px-4 gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--background-color)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[var(--background-color)] rounded-md w-1/3" />
            <div className="h-2.5 bg-[var(--background-color)] rounded-md w-1/4" />
          </div>
          <div className="w-16 h-6 rounded-lg bg-[var(--background-color)]" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex items-center gap-4 animate-pulse"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--background-color)] shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-2.5 bg-[var(--background-color)] rounded-md w-1/2" />
            <div className="h-5 bg-[var(--background-color)] rounded-md w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
