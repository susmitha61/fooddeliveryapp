'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  icon?: LucideIcon;
  label?: string;
  title?: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral' | string;
  accentColor?: string; // e.g. 'emerald', 'sky', 'amber', 'rose', 'orange', 'purple'
  colorClass?: string;
  sublabel?: string;
}

export function StatCard({
  icon: Icon,
  label,
  title,
  value,
  delta,
  trend,
  accentColor = 'orange',
  colorClass,
  sublabel,
}: StatCardProps) {
  const displayLabel = label || title || '';

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  };

  const colors = colorMap[accentColor] || colorMap.orange;

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-[var(--primary-color)]/40 transition-all">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colorClass || colors.text} border ${colors.border} flex items-center justify-center font-bold shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider truncate">
            {displayLabel}
          </p>
          <p className="font-outfit font-extrabold text-2xl text-[var(--text-primary)] mt-0.5 truncate">
            {value}
          </p>
          {sublabel && (
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">{sublabel}</p>
          )}
        </div>
      </div>

      {delta && (
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
            trend === 'up'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : trend === 'down'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-[var(--background-color)] text-[var(--text-muted)] border-[var(--border-color)]'
          }`}
        >
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
