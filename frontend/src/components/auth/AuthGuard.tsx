'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types';
import { FoodLoader } from '@/components/three/FoodLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShieldAlert } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    // Unauthenticated guest trying to access protected route
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based access control check
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
      // Redirect to correct dashboard for their role
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
    }
  }, [mounted, isAuthenticated, user, isLoading, allowedRoles, router, pathname]);

  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center">
        <FoodLoader />
      </div>
    );
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-6">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description={`Your account (${user.role.replace(/_/g, ' ')}) does not have permission to view this section.`}
          action={{
            label: 'Go to Your Dashboard',
            onClick: () => {
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
            },
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
