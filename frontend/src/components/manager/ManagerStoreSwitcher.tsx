'use client';

import React from 'react';
import { Store, ChevronDown, MapPin, Check } from 'lucide-react';

interface ManagerStoreSwitcherProps {
  restaurants: any[];
  selectedRestaurantId: string;
  onSelectRestaurantId: (id: string) => void;
}

export function ManagerStoreSwitcher({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurantId,
}: ManagerStoreSwitcherProps) {
  if (!restaurants || restaurants.length === 0) return null;

  const currentRest = restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0];

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mb-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
              Assigned Store Operations
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              currentRest.isOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {currentRest.isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
          <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)] leading-tight mt-0.5">
            {currentRest.name}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--primary-color)]" />
            <span>{[currentRest.area, currentRest.city].filter(Boolean).join(', ')} • {currentRest.cuisineType}</span>
          </p>
        </div>
      </div>

      {restaurants.length > 1 ? (
        <div className="w-full sm:w-auto flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap hidden md:inline">
            Switch Store:
          </label>
          <select
            value={selectedRestaurantId}
            onChange={(e) => onSelectRestaurantId(e.target.value)}
            className="w-full sm:w-64 p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)]"
          >
            {restaurants.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.city || 'Store'})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--background-color)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
          1 Store Assigned
        </span>
      )}
    </div>
  );
}
