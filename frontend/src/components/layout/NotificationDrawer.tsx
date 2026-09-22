'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Info,
  CheckCheck,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  closeNotificationDrawer,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '@/store/slices/notificationSlice';

export function NotificationDrawer() {
  const dispatch = useAppDispatch();
  const { items, isOpen } = useAppSelector((state) => state.notification);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeNotificationDrawer());
      }
    },
    [dispatch]
  );

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

  const unreadCount = items.filter((i) => !i.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-orange-400" />;
      case 'support':
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => dispatch(closeNotificationDrawer())}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-[var(--surface-color)] border-l border-[var(--border-color)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-sm text-[var(--text-primary)]">
                  Notifications
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllAsRead())}
                  className="p-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary-color)] rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {items.length > 0 && (
                <button
                  onClick={() => dispatch(clearNotifications())}
                  className="p-1.5 text-xs text-[var(--text-muted)] hover:text-rose-400 rounded-lg transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => dispatch(closeNotificationDrawer())}
                className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-lg transition-colors ml-1"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)] p-2 space-y-1">
            {items.length === 0 ? (
              <div className="text-center py-20 px-4">
                <Bell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                <h4 className="font-outfit font-bold text-sm text-[var(--text-primary)]">
                  No Notifications
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  You are completely caught up!
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) dispatch(markAsRead(item.id));
                  }}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    !item.read
                      ? 'bg-[var(--primary-color)]/5 border border-[var(--primary-color)]/20'
                      : 'hover:bg-[var(--background-color)]/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5
                          className={`text-xs font-bold truncate ${
                            !item.read
                              ? 'text-[var(--text-primary)]'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {item.title}
                        </h5>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--text-muted)]">
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {item.link && (
                          <Link
                            href={item.link}
                            onClick={() => dispatch(closeNotificationDrawer())}
                            className="inline-flex items-center gap-1 text-[var(--primary-color)] font-semibold hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
