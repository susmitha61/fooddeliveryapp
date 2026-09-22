'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store';
import { CartDrawer } from './CartDrawer';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((s) => s.theme.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Also store in localStorage for SSR
    localStorage.setItem('biterush_theme', theme);
  }, [theme]);

  useEffect(() => {
    // On mount, restore theme from localStorage
    const saved = localStorage.getItem('biterush_theme') as 'dark' | 'warm' | null;
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return <>{children}</>;
}
