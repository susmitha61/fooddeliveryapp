'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { OwnerSidebar } from '@/components/layout/CustomerSidebar';
import { SectionLayout } from '@/components/layout/SectionLayout';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['RESTAURANT_OWNER', 'ADMIN']}>
      <SectionLayout sidebar={<OwnerSidebar />}>
        {children}
      </SectionLayout>
    </AuthGuard>
  );
}
