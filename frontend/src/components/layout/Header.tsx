'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, LogOut, LogIn, UserPlus, Zap, User as UserIcon, Shield, Menu, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';
import { NotificationDrawer } from './NotificationDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { openCart, clearCart } from '@/store/slices/cartSlice';
import { toggleNotificationDrawer } from '@/store/slices/notificationSlice';
import { baseApi } from '@/store/api/baseApi';
import { useLogoutMutation } from '@/store/api/authApi';
import { ROUTES } from '@/lib/constants';
import toast from 'react-hot-toast';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const cartItemsCount = useAppSelector((state) => state.cart.totalItems);
  const unreadNotificationsCount = useAppSelector(
    (state) => state.notification.items.filter((i) => !i.read).length
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignore API network errors on logout, still clear local session
    } finally {
      dispatch(logout());
      dispatch(clearCart());
      dispatch(baseApi.util.resetApiState());
      toast.success('Logged out successfully');
      router.push(ROUTES.HOME);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--surface-color)]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-nav'))}
            className="md:hidden p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary-color)] transition-all flex items-center justify-center"
            title="Toggle Navigation"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--primary-color)] to-amber-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-[var(--primary-color)]/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-outfit font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] via-[var(--primary-color)] to-amber-400">
              BiteRush
            </span>
          </Link>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Notifications Bell */}
          {mounted && isAuthenticated && (
            <button
              onClick={() => dispatch(toggleNotificationDrawer())}
              className="relative p-2.5 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] transition-all flex items-center justify-center"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {mounted && isAuthenticated ? (
            <>
              {/* Cart Drawer Trigger — CUSTOMER role only */}
              {(user?.role === 'CUSTOMER' || !user?.role) && (
                <button
                  onClick={() => dispatch(openCart())}
                  className="relative p-2.5 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-primary)] transition-all flex items-center justify-center"
                  title="View Cart"
                  aria-label="Shopping Cart"
                >
                  <ShoppingBag className="w-4 h-4 text-[var(--primary-color)]" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--primary-color)] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Profile Info & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-color)]">
                <Link
                  href={ROUTES.PROFILE}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--background-color)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/20 text-[var(--primary-color)] font-bold text-xs flex items-center justify-center border border-[var(--primary-color)]/30">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-bold text-[var(--text-primary)] block line-clamp-1">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--primary-color)] block uppercase">
                      {user?.role || 'CUSTOMER'}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Logout Session"
                  aria-label="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            /* Guest Actions */
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.LOGIN}
                className="px-4 py-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                <span>Sign In</span>
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className="px-4 py-2 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold transition-all shadow-md shadow-[var(--primary-color)]/20 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <MobileNav />
      <NotificationDrawer />
    </header>
  );
}
