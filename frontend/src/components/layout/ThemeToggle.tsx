'use client';

import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleTheme } from '@/store/slices/themeSlice';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme.theme);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => dispatch(toggleTheme())}
      className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
      title={`Switch to ${theme === 'dark' ? 'warm' : 'dark'} theme`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? (
          <Sun size={18} style={{ color: 'var(--accent-2)' }} />
        ) : (
          <Moon size={18} style={{ color: 'var(--accent)' }} />
        )}
      </motion.div>
    </motion.button>
  );
}
