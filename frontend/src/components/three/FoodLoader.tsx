'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';

export function FoodLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] to-amber-400 p-0.5 shadow-lg shadow-[var(--primary-color)]/30 flex items-center justify-center"
      >
        <div className="w-full h-full bg-[var(--surface-color)] rounded-[14px] flex items-center justify-center text-[var(--primary-color)]">
          <Utensils className="w-6 h-6 animate-pulse" />
        </div>
      </motion.div>
      <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-wider uppercase animate-pulse">
        Loading BiteRush...
      </p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <FoodLoader />
    </div>
  );
}
