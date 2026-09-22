'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, ShoppingBag, Heart, MapPin, User, MessageSquare,
  LayoutDashboard, Store, Utensils, ClipboardList, BarChart2,
  Car, Truck, Package, Users, ShieldCheck, Settings, FileText,
  Star, CreditCard, HelpCircle, Bell,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export interface SidebarProps {
  role?: string;
}

export function getNavItemsForRole(role?: string): { label: string; accentClass: string; items: NavItem[] } {
  switch (role?.toUpperCase()) {
    case 'RESTAURANT_OWNER':
      return {
        label: 'Restaurant Owner',
        accentClass: 'text-amber-400',
        items: [
          { name: 'Dashboard', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
          { name: 'My Restaurants', href: '/owner/restaurants', icon: Store },
          { name: 'Manager Management', href: '/owner/managers', icon: Users },
          { name: 'Menu Management', href: ROUTES.OWNER_MENU, icon: Utensils },
          { name: 'Orders', href: '/owner/orders', icon: ClipboardList },
          { name: 'Payouts & Billing', href: '/owner/payments', icon: CreditCard },
          { name: 'Customer Reviews', href: '/owner/reviews', icon: Star },
          { name: 'Reports', href: '/owner/reports', icon: BarChart2 },
          { name: 'Support', href: '/owner/support', icon: HelpCircle },
          { name: 'My Profile', href: ROUTES.PROFILE, icon: User },
        ],
      };
    case 'DELIVERY_DRIVER':
      return {
        label: 'Courier Portal',
        accentClass: 'text-emerald-400',
        items: [
          { name: 'Active Deliveries', href: '/driver/deliveries', icon: Truck },
          { name: 'Delivery History', href: '/driver/history', icon: Package },
          { name: 'Earnings & Payouts', href: '/driver/payments', icon: CreditCard },
          { name: 'My Profile', href: ROUTES.PROFILE, icon: User },
          { name: 'Support', href: ROUTES.SUPPORT, icon: HelpCircle },
        ],
      };
    case 'MANAGER':
      return {
        label: 'Manager Portal',
        accentClass: 'text-sky-400',
        items: [
          { name: 'Overview', href: '/manager/dashboard', icon: LayoutDashboard },
          { name: 'All Orders', href: '/manager/orders', icon: ClipboardList },
          { name: 'Restaurants', href: '/manager/restaurants', icon: Store },
          { name: 'Customer Oversight', href: '/manager/users', icon: Users },
          { name: 'Menu Management', href: '/manager/menu', icon: Utensils },
          { name: 'Payment Transactions', href: '/manager/payments', icon: CreditCard },
          { name: 'Customer Reviews', href: '/manager/reviews', icon: Star },
          { name: 'Support Tickets', href: '/manager/support', icon: MessageSquare },
          { name: 'Reports', href: '/manager/reports', icon: BarChart2 },
          { name: 'My Profile', href: ROUTES.PROFILE, icon: User },
        ],
      };
    case 'ADMIN':
      return {
        label: 'Admin Panel',
        accentClass: 'text-rose-400',
        items: [
          { name: 'System Overview', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'Driver Management', href: '/admin/drivers', icon: Truck },
          { name: 'Manager Management', href: '/admin/managers', icon: Users },
          { name: 'Active Sessions', href: ROUTES.ADMIN_SESSIONS, icon: ShieldCheck },
          { name: 'Restaurant Operations', href: '/admin/restaurants', icon: Store },
          { name: 'Menu Management', href: '/admin/menu', icon: Utensils },
          { name: 'All Orders', href: '/admin/orders', icon: ClipboardList },
          { name: 'Payment Gateway', href: '/admin/payments', icon: CreditCard },
          { name: 'Customer Reviews', href: '/admin/reviews', icon: Star },
          { name: 'Support Tickets', href: '/admin/support', icon: MessageSquare },
          { name: 'Reports', href: '/admin/reports', icon: BarChart2 },
          { name: 'My Profile', href: ROUTES.PROFILE, icon: User },
        ],
      };
    case 'CUSTOMER':
      return {
        label: 'Customer Portal',
        accentClass: 'text-[var(--primary-color)]',
        items: [
          { name: 'Home', href: ROUTES.HOME, icon: Home },
          { name: 'Explore Restaurants', href: ROUTES.BROWSE, icon: Search },
          { name: 'My Orders', href: ROUTES.ORDERS, icon: ShoppingBag },
          { name: 'Saved Addresses', href: ROUTES.ADDRESSES, icon: MapPin },
          { name: 'Favourites', href: ROUTES.FAVOURITES, icon: Heart },
          { name: 'Payment History', href: ROUTES.PAYMENTS, icon: CreditCard },
          { name: 'My Profile', href: ROUTES.PROFILE, icon: User },
          { name: 'My Reviews', href: '/profile/reviews', icon: Star },
          { name: 'Support', href: ROUTES.SUPPORT, icon: HelpCircle },
        ],
      };
    default:
      return {
        label: 'Explore BiteRush',
        accentClass: 'text-[var(--text-muted)]',
        items: [
          { name: 'Home', href: ROUTES.HOME, icon: Home },
          { name: 'Browse Restaurants', href: ROUTES.BROWSE, icon: Search },
          { name: 'Sign In', href: '/auth/login', icon: User },
          { name: 'Register', href: '/auth/register', icon: ShieldCheck },
        ],
      };
  }
}

function SidebarBase({
  label, accentClass, items,
}: {
  label: string;
  accentClass: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-[var(--border-color)] p-4 bg-[var(--surface-color)]/50 backdrop-blur-sm min-h-[calc(100vh-4rem)] gap-1">
      <span className={`px-3 text-[10px] font-extrabold uppercase tracking-widest ${accentClass} block mb-3`}>
        {label}
      </span>

      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isExact = pathname === item.href;
          const isNested = item.href !== '/' && pathname.startsWith(item.href + '/');
          const isActive = isExact || isNested;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                isActive
                  ? 'bg-[var(--primary-color)] text-white shadow-md shadow-[var(--primary-color)]/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-color)]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--primary-color)]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

/* ─── ROLE-SPECIFIC EXPORTS ─────────────────────────────────────────────── */
export function GuestSidebar() {
  const { label, accentClass, items } = getNavItemsForRole(undefined);
  return <SidebarBase label={label} accentClass={accentClass} items={items} />;
}

export function CustomerSidebar() {
  const { label, accentClass, items } = getNavItemsForRole('CUSTOMER');
  return <SidebarBase label={label} accentClass={accentClass} items={items} />;
}

export function OwnerSidebar() {
  const { label, accentClass, items } = getNavItemsForRole('RESTAURANT_OWNER');
  return <SidebarBase label={label} accentClass={accentClass} items={items} />;
}

export function DriverSidebar() {
  const { label, accentClass, items } = getNavItemsForRole('DELIVERY_DRIVER');
  return <SidebarBase label={label} accentClass={accentClass} items={items} />;
}

export function ManagerSidebar() {
  const { label, accentClass, items } = getNavItemsForRole('MANAGER');
  return <SidebarBase label={label} accentClass={accentClass} items={items} />;
}

export function AdminSidebar() {
  const { label, accentClass, items } = getNavItemsForRole('ADMIN');
  return <SidebarBase label={label} accentClass={accentClass} items={items} />;
}

/* ─── DYNAMIC: renders correct sidebar by role ───────────────────────────── */
export function RoleSidebar({ role }: SidebarProps) {
  switch (role?.toUpperCase()) {
    case 'CUSTOMER':        return <CustomerSidebar />;
    case 'RESTAURANT_OWNER': return <OwnerSidebar />;
    case 'DELIVERY_DRIVER': return <DriverSidebar />;
    case 'MANAGER':         return <ManagerSidebar />;
    case 'ADMIN':           return <AdminSidebar />;
    default:                return <GuestSidebar />;
  }
}
