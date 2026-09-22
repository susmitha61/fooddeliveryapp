'use client';

import React, { ReactNode } from 'react';
import { Header } from './Header';

interface SectionLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
}

export function SectionLayout({
  sidebar,
  children,
  maxWidthClass = 'max-w-7xl',
}: SectionLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
      <Header />
      <div className="flex-1 flex">
        {sidebar}
        <main className={`flex-1 p-4 sm:p-8 ${maxWidthClass} mx-auto w-full`}>
          {children}
        </main>
      </div>
    </div>
  );
}
