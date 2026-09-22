'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { addItem, clearPendingItem, openCart } from '@/store/slices/cartSlice';
import { UserRole } from '@/types';
import { ROUTES } from '@/lib/constants';
import { LogIn, Mail, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);
  const pendingItem = useAppSelector((state) => state.cart.pendingItem);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (pendingItem && (currentUser.role === 'CUSTOMER' || !currentUser.role)) {
        dispatch(
          addItem({
            restaurantId: pendingItem.restaurantId,
            restaurantName: pendingItem.restaurantName,
            item: pendingItem.item,
          })
        );
        dispatch(clearPendingItem());
        dispatch(openCart());
        router.push(redirectUrl || `/restaurants/${pendingItem.restaurantId}`);
        return;
      }
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }
      switch (currentUser.role) {
        case 'RESTAURANT_OWNER':
          router.push(ROUTES.OWNER_DASHBOARD);
          break;
        case 'DELIVERY_DRIVER':
          router.push(ROUTES.DRIVER_ORDERS);
          break;
        case 'ADMIN':
          router.push(ROUTES.ADMIN_DASHBOARD);
          break;
        case 'MANAGER':
          router.push(ROUTES.MANAGER_DASHBOARD);
          break;
        default:
          router.push(ROUTES.BROWSE);
      }
    }
  }, [isAuthenticated, currentUser, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      const res = await login({ email, password }).unwrap();
      // Backend AuthResponse: { accessToken, tokenType, expiresIn, user: { id, name, email, phone, role, ... } }
      const d = res.data;
      const token = d?.accessToken;
      const backendUser = d?.user;

      if (!token || !backendUser) {
        toast.error('Invalid response from server. Please try again.');
        return;
      }

      const user = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        phone: backendUser.phone || '',
        role: (backendUser.role as UserRole) || 'CUSTOMER',
        isActive: backendUser.isActive ?? true,
        isLoggedIn: backendUser.isLoggedIn ?? true,
      };

      dispatch(setCredentials({ token, user }));
      toast.success(`Welcome back, ${user.name}! 🎉`);

      if (pendingItem && (user.role === 'CUSTOMER' || !user.role)) {
        dispatch(
          addItem({
            restaurantId: pendingItem.restaurantId,
            restaurantName: pendingItem.restaurantName,
            item: pendingItem.item,
          })
        );
        dispatch(clearPendingItem());
        dispatch(openCart());
        router.push(redirectUrl || `/restaurants/${pendingItem.restaurantId}`);
        return;
      }

      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }

      switch (user.role) {
        case 'RESTAURANT_OWNER':
          router.push(ROUTES.OWNER_DASHBOARD);
          break;
        case 'DELIVERY_DRIVER':
          router.push(ROUTES.DRIVER_ORDERS);
          break;
        case 'ADMIN':
          router.push(ROUTES.ADMIN_DASHBOARD);
          break;
        case 'MANAGER':
          router.push(ROUTES.MANAGER_DASHBOARD);
          break;
        default:
          router.push(ROUTES.BROWSE);
      }
    } catch (err: any) {
      const errorMsg =
        err?.data?.data?.email ||
        err?.data?.data?.password ||
        err?.data?.message ||
        'Login failed. Please check credentials.';
      toast.error(errorMsg);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      CUSTOMER: 'customer@biterush.com',
      RESTAURANT_OWNER: 'owner@biterush.com',
      DELIVERY_DRIVER: 'driver@biterush.com',
      MANAGER: 'manager@biterush.com',
      ADMIN: 'admin@biterush.com',
      GUEST: 'guest@biterush.com',
    };
    setEmail(roleEmailMap[role] || 'customer@biterush.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Minimal Auth Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--surface-color)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white shadow-md shadow-[var(--primary-color)]/20">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-outfit font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
            Bite<span className="text-[var(--primary-color)]">Rush</span>
          </span>
        </Link>
        <Link
          href="/browse"
          className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
        >
          Explore Restaurants →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[var(--surface-color)] border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] to-amber-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[var(--primary-color)]/30">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <h1 className="font-outfit text-2xl font-bold">Welcome Back</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Sign in to BiteRush Food Delivery Ecosystem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[var(--primary-color)]/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2 text-center">
              Quick Fill Demo Logins
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('CUSTOMER')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-colors"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('RESTAURANT_OWNER')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-colors"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('DELIVERY_DRIVER')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-colors"
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-[var(--text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link href={ROUTES.REGISTER} className="text-[var(--primary-color)] font-semibold hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center">
          <span className="text-[var(--text-muted)]">Loading...</span>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
