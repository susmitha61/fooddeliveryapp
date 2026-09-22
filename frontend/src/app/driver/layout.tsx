'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DriverSidebar } from '@/components/layout/CustomerSidebar';
import { SectionLayout } from '@/components/layout/SectionLayout';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['DELIVERY_DRIVER', 'ADMIN']}>
      <SectionLayout sidebar={<DriverSidebar />}>
        {children}
      </SectionLayout>
    </AuthGuard>
  );
}
