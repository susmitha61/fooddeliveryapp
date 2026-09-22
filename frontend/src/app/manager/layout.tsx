'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ManagerSidebar } from '@/components/layout/CustomerSidebar';
import { SectionLayout } from '@/components/layout/SectionLayout';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['MANAGER', 'ADMIN']}>
      <SectionLayout sidebar={<ManagerSidebar />}>
        {children}
      </SectionLayout>
    </AuthGuard>
  );
}
