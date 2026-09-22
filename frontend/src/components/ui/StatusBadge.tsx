'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'ticket' | 'restaurant' | 'payment' | 'generic';
}

export function StatusBadge({ status, type = 'generic' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase().trim();

  let style = 'bg-gray-500/15 text-gray-400 border-gray-500/30';

  if (type === 'payment') {
    switch (norm) {
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCESS':
      case 'SETTLED':
        style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        break;
      case 'PENDING':
      case 'PROCESSING':
      case 'INITIATED':
        style = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        break;
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        style = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        break;
      case 'FAILED':
      case 'CANCELLED':
      case 'REJECTED':
        style = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        break;
    }
  } else if (type === 'order') {
    switch (norm) {
      case 'PLACED':
      case 'PENDING':
        style = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        break;
      case 'CONFIRMED':
        style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        break;
      case 'PREPARING':
        style = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        break;
      case 'READY_FOR_PICKUP':
        style = 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse';
        break;
      case 'OUT_FOR_DELIVERY':
        style = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
        break;
      case 'DELIVERED':
        style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        break;
      case 'CANCELLED':
        style = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        break;
    }
  } else if (type === 'ticket') {
    switch (norm) {
      case 'OPEN':
        style = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        break;
      case 'IN_PROGRESS':
        style = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        break;
      case 'WAITING_USER':
        style = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        break;
      case 'RESOLVED':
        style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        break;
      case 'CLOSED':
        style = 'bg-gray-500/15 text-gray-400 border-gray-500/30';
        break;
    }
  } else if (type === 'restaurant') {
    switch (norm) {
      case 'ACTIVE':
      case 'OPEN':
      case 'APPROVED':
        style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        break;
      case 'PENDING':
      case 'PENDING_APPROVAL':
        style = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        break;
      case 'CLOSED':
      case 'INACTIVE':
        style = 'bg-gray-500/15 text-gray-400 border-gray-500/30';
        break;
      case 'REJECTED':
      case 'SUSPENDED':
        style = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        break;
    }
  } else {
    // Generic fallback
    if (['SUCCESS', 'ACTIVE', 'CONFIRMED', 'DELIVERED', 'PAID', 'SETTLED'].includes(norm)) {
      style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (['PENDING', 'WARNING', 'PREPARING', 'PROCESSING', 'INITIATED'].includes(norm)) {
      style = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    } else if (['CANCELLED', 'FAILED', 'ERROR', 'REJECTED'].includes(norm)) {
      style = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    } else if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(norm)) {
      style = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
  }

  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style}`}>
      {norm.replace(/_/g, ' ')}
    </span>
  );
}
