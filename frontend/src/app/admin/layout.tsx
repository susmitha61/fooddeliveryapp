'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminSidebar } from '@/components/layout/CustomerSidebar';
import { SectionLayout } from '@/components/layout/SectionLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <SectionLayout sidebar={<AdminSidebar />}>
        {children}
      </SectionLayout>
    </AuthGuard>
  );
}
