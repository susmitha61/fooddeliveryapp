'use client';

import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info';
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  description,
  badge,
  badgeVariant = 'default',
  actions,
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  const badgeStyles = {
    default: 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] border-[var(--primary-color)]/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {badge && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyles[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>
        {displaySubtitle && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            {displaySubtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
