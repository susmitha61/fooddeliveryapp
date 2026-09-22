'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateActionObj {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateActionObj | React.ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  const isActionObject = (act: any): act is EmptyStateActionObj => {
    return act && typeof act === 'object' && 'label' in act;
  };

  return (
    <div className="text-center py-16 px-4 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]/60 flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--background-color)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action && (
        isActionObject(action) ? (
          action.href ? (
            <a
              href={action.href}
              className="px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md inline-block"
            >
              {action.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              {action.label}
            </button>
          )
        ) : (
          <div>{action}</div>
        )
      )}
    </div>
  );
}
