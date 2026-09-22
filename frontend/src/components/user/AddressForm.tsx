'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const ADDRESS_LABELS = ['HOME', 'WORK', 'OTHER'];

export interface AddressFormData {
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface AddressFormProps {
  initialData?: any;
  userId?: string;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddressForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: AddressFormProps) {
  const [form, setForm] = useState<AddressFormData>({
    label: initialData?.label || 'HOME',
    streetAddress: initialData?.streetAddress || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    landmark: initialData?.landmark || '',
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.streetAddress.trim() || form.streetAddress.trim().length < 5) {
      errs.streetAddress = 'Street address must be at least 5 characters';
    }
    if (!form.city.trim() || form.city.trim().length < 2) {
      errs.city = 'City must be at least 2 characters';
    }
    if (!form.state.trim() || form.state.trim().length < 2) {
      errs.state = 'State must be at least 2 characters';
    }
    if (!form.pincode.trim() || !/^[1-9][0-9]{5}$/.test(form.pincode.trim())) {
      errs.pincode = 'Enter a valid 6-digit postal pincode (e.g. 400001)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof AddressFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  const getInputCls = (field: string) =>
    `w-full px-3 py-2.5 bg-[var(--background-color)] border ${
      errors[field] ? 'border-rose-500/80 focus:border-rose-500' : 'border-[var(--border-color)] focus:border-[var(--primary-color)]'
    } rounded-xl text-sm focus:outline-none transition-colors`;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Label *
          </label>
          <select
            className={getInputCls('label')}
            value={form.label}
            onChange={(e) => handleChange('label', e.target.value)}
          >
            {ADDRESS_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Street Address *
          </label>
          <input
            className={getInputCls('streetAddress')}
            value={form.streetAddress}
            onChange={(e) => handleChange('streetAddress', e.target.value)}
            placeholder="Building, Street Name"
          />
          {errors.streetAddress && (
            <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.streetAddress}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            City *
          </label>
          <input
            className={getInputCls('city')}
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Mumbai"
          />
          {errors.city && (
            <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.city}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            State *
          </label>
          <input
            className={getInputCls('state')}
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="Maharashtra"
          />
          {errors.state && (
            <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.state}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Pincode *
          </label>
          <input
            className={getInputCls('pincode')}
            value={form.pincode}
            onChange={(e) => handleChange('pincode', e.target.value)}
            placeholder="400001"
            maxLength={6}
          />
          {errors.pincode && (
            <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.pincode}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Landmark
          </label>
          <input
            className={getInputCls('landmark')}
            value={form.landmark}
            onChange={(e) => handleChange('landmark', e.target.value)}
            placeholder="Near temple, opposite park..."
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.isDefault ? 'bg-[var(--primary-color)]' : 'bg-[var(--border-color)]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isDefault ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-xs text-[var(--text-secondary)]">Set as Default</span>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-sm font-semibold rounded-xl hover:bg-[var(--background-color)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center gap-1.5 hover:bg-[var(--primary-hover)]"
        >
          <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}
