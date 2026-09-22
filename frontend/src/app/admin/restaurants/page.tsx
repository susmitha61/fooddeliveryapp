'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  useGetRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useToggleOpenMutation,
  useChangeRestaurantStatusMutation,
  useDeleteRestaurantMutation
} from '@/store/api/restaurantApi';
import { LoadingSpinner } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Store, Plus, Edit2, Trash2, MapPin, Phone, Mail, Clock, Star, X, Save,
  Image as ImageIcon, Upload, Power, ShieldCheck, Users
} from 'lucide-react';
import { AssignManagerModal } from '@/components/restaurants/AssignManagerModal';
import { RestaurantRatingBadge } from '@/components/ui/RestaurantRatingBadge';
import toast from 'react-hot-toast';

const CUISINE_OPTIONS = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Thai',
  'Japanese', 'Mediterranean', 'Fast Food', 'Pizza', 'Biryani',
  'South Indian', 'North Indian', 'Continental', 'Bakery', 'Cafe',
];

interface RestaurantFormData {
  name: string; description: string; cuisineType: string;
  mealTypes: string[]; streetAddress: string; area: string;
  city: string; state: string; pincode: string;
  phone: string; email: string;
  openingTime: string; closingTime: string;
  deliveryFee: string; minimumOrderAmount: string;
  isPureVeg: boolean; imageUrl: string;
}

const EMPTY_FORM: RestaurantFormData = {
  name: '', description: '', cuisineType: '',
  mealTypes: ['ALL_DAY'], streetAddress: '', area: '',
  city: '', state: '', pincode: '',
  phone: '', email: '',
  openingTime: '09:00', closingTime: '22:00',
  deliveryFee: '', minimumOrderAmount: '',
  isPureVeg: false, imageUrl: '',
};

function RestaurantForm({
  initialData, onSave, onCancel, isLoading,
}: {
  initialData?: any; onSave: (data: any) => void;
  onCancel: () => void; isLoading: boolean;
}) {
  const [form, setForm] = useState<RestaurantFormData>(() => {
    if (!initialData) return EMPTY_FORM;
    return {
      name: initialData.name || '',
      description: initialData.description || '',
      cuisineType: initialData.cuisineType || '',
      mealTypes: initialData.mealTypes || ['ALL_DAY'],
      streetAddress: initialData.streetAddress || '',
      area: initialData.area || '',
      city: initialData.city || '',
      state: initialData.state || '',
      pincode: initialData.pincode || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      openingTime: initialData.openingTime || '09:00',
      closingTime: initialData.closingTime || '22:00',
      deliveryFee: String(initialData.deliveryFee ?? ''),
      minimumOrderAmount: String(initialData.minimumOrderAmount ?? ''),
      isPureVeg: initialData.isPureVeg || false,
      imageUrl: initialData.imageUrl || '',
    };
  });

  const set = (key: keyof RestaurantFormData, val: any) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error('Phone must be a valid 10-digit mobile number');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) {
      toast.error('Pincode must be a valid 6-digit pincode');
      return;
    }
    onSave({
      name: form.name,
      description: form.description || undefined,
      cuisineType: form.cuisineType,
      mealTypes: form.mealTypes.length > 0 ? form.mealTypes : ['ALL_DAY'],
      streetAddress: form.streetAddress,
      area: form.area,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      phone: form.phone,
      email: form.email || undefined,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      deliveryFee: form.deliveryFee ? parseFloat(form.deliveryFee) : 0,
      minimumOrderAmount: form.minimumOrderAmount ? parseFloat(form.minimumOrderAmount) : 0,
      isPureVeg: form.isPureVeg,
      imageUrl: form.imageUrl || undefined,
    });
  };

  const inputCls = "w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]";
  const labelCls = "block text-xs font-semibold text-[var(--text-secondary)] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl">
        <h3 className="font-outfit font-bold text-sm mb-4 text-[var(--primary-color)]">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Restaurant Name *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Hillton Restaurant" required minLength={2} maxLength={150} />
          </div>
          <div>
            <label className={labelCls}>Cuisine Type *</label>
            <select className={inputCls} value={form.cuisineType} onChange={e => set('cuisineType', e.target.value)} required>
              <option value="">Select cuisine...</option>
              {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Phone *</label>
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="9876543210" pattern="^[6-9]\d{9}$" maxLength={10} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Brief description of the restaurant..." maxLength={500} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="hillton@biterush.com" />
          </div>
          <div>
            <label className={labelCls}>Image URL or File Upload</label>
            <div className="space-y-2">
              <input className={inputCls} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
                placeholder="https://your-image.com/photo.jpg" />
              <label className="flex items-center gap-2 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--primary-color)] cursor-pointer transition-all w-fit">
                <Upload className="w-4 h-4 text-[var(--primary-color)]" /> Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => { set('imageUrl', reader.result as string); toast.success('Image uploaded!'); };
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl">
        <h3 className="font-outfit font-bold text-sm mb-4 text-[var(--primary-color)]">Location & Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Street Address *</label>
            <input className={inputCls} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)}
              placeholder="e.g. 124 Main St, Building A" required />
          </div>
          <div>
            <label className={labelCls}>Area / Locality *</label>
            <input className={inputCls} value={form.area} onChange={e => set('area', e.target.value)}
              placeholder="Tech District" required />
          </div>
          <div>
            <label className={labelCls}>City *</label>
            <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="Mumbai" required />
          </div>
          <div>
            <label className={labelCls}>State *</label>
            <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value)}
              placeholder="Maharashtra" required />
          </div>
          <div>
            <label className={labelCls}>Pincode *</label>
            <input className={inputCls} value={form.pincode} onChange={e => set('pincode', e.target.value)}
              placeholder="400001" pattern="^[1-9][0-9]{5}$" maxLength={6} required />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl">
          Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="px-5 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5">
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : initialData ? 'Update Restaurant' : 'Create Restaurant'}</span>
        </button>
      </div>
    </form>
  );
}

export default function AdminRestaurantsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRest, setEditingRest] = useState<any>(null);
  const [assignModalRestaurant, setAssignModalRestaurant] = useState<any | null>(null);

  const { data: restaurantsRes, isLoading, refetch } = useGetRestaurantsQuery({ page: 0, size: 50 }, { pollingInterval: 3000 });
  const [createRestaurant, { isLoading: isCreating }] = useCreateRestaurantMutation();
  const [updateRestaurant, { isLoading: isUpdating }] = useUpdateRestaurantMutation();
  const [toggleOpen] = useToggleOpenMutation();
  const [changeStatus, { isLoading: isChangingStatus }] = useChangeRestaurantStatusMutation();
  const [deleteRestaurant] = useDeleteRestaurantMutation();

  const rawData = restaurantsRes?.data;
  const restaurants: any[] = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.content) ? rawData.content : [];

  const handleCreate = async (body: any) => {
    try {
      await createRestaurant(body).unwrap();
      toast.success('Restaurant created by Admin!');
      setShowAddForm(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create restaurant');
    }
  };

  const handleUpdate = async (body: any) => {
    if (!editingRest) return;
    try {
      await updateRestaurant({ id: editingRest.id, body }).unwrap();
      toast.success('Restaurant details updated by Admin!');
      setEditingRest(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update restaurant');
    }
  };

  const handleToggleOpen = async (id: string) => {
    try {
      await toggleOpen(id).unwrap();
      toast.success('Restaurant open status toggled!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle status');
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await changeStatus({ id, status: 'APPROVED' }).unwrap();
      toast.success(`Restaurant "${name}" approved successfully!`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve restaurant');
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Reject restaurant "${name}"?`)) return;
    try {
      await changeStatus({ id, status: 'REJECTED' }).unwrap();
      toast.success(`Restaurant "${name}" rejected`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reject restaurant');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete restaurant "${name}" permanently?`)) return;
    try {
      await deleteRestaurant(id).unwrap();
      toast.success(`"${name}" deleted by Admin`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete restaurant');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Restaurant Governance"
        description="Full administrative system control over restaurant registration, editing, menu operations, and deletion."
        actions={
          !showAddForm && !editingRest ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2.5 bg-[var(--primary-color)] text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Restaurant</span>
            </button>
          ) : null
        }
      />

            {(showAddForm || editingRest) && (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-5">
                  <h2 className="font-outfit font-bold text-lg">
                    {editingRest ? `Edit Restaurant: ${editingRest.name}` : 'Register New Restaurant to System'}
                  </h2>
                  <button onClick={() => { setShowAddForm(false); setEditingRest(null); }} className="p-1 text-[var(--text-muted)] hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <RestaurantForm
                  initialData={editingRest}
                  onSave={editingRest ? handleUpdate : handleCreate}
                  onCancel={() => { setShowAddForm(false); setEditingRest(null); }}
                  isLoading={isCreating || isUpdating}
                />
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <LoadingSpinner size="lg" />
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)] space-y-3">
                <Store className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-1" />
                <h3 className="font-outfit font-bold text-lg">No Restaurants Registered Yet</h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Register First Restaurant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurants.map((rest: any) => (
                  <div
                    key={rest.id}
                    className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-[var(--primary-color)]/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {rest.imageUrl ? (
                          <img src={rest.imageUrl} alt={rest.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--border-color)]" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-bold flex items-center justify-center shrink-0">
                            <Store className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 inline-block">
                              {rest.cuisineType || 'Multi-Cuisine'}
                            </span>
                            <StatusBadge status={rest.status || (rest.isOpen !== false ? 'ACTIVE' : 'INACTIVE')} type="restaurant" />
                          </div>
                          <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)]">{rest.name}</h3>
                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                            <span>{[rest.area, rest.city].filter(Boolean).join(', ')}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleOpen(rest.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                          rest.isOpen !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        {rest.isOpen !== false ? '● OPEN NOW' : '○ CLOSED'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-color)]/60">
                      <RestaurantRatingBadge
                        restaurantId={rest.id}
                        initialRating={rest.rating}
                        initialCount={rest.totalRatings}
                        showCount
                      />

                      <div className="flex items-center gap-2">
                        {(rest.status === 'PENDING_APPROVAL' || rest.status === 'PENDING') && (
                          <div className="flex items-center gap-1.5 mr-1">
                            <button
                              onClick={() => handleApprove(rest.id, rest.name)}
                              disabled={isChangingStatus}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                              title="Approve Restaurant"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(rest.id, rest.name)}
                              disabled={isChangingStatus}
                              className="px-2.5 py-1 bg-rose-600/15 text-rose-400 border border-rose-600/30 hover:bg-rose-600/25 rounded-lg text-xs font-bold transition-all"
                              title="Reject Restaurant"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        <Link
                          href={`/admin/menu?restaurantId=${rest.id}`}
                          className="px-3 py-1.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20 hover:bg-[var(--primary-color)] hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Manage Menu
                        </Link>

                        <button
                          onClick={() => setAssignModalRestaurant(rest)}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Assign Manager</span>
                          {rest.managerIds && (rest.managerIds.length > 0 || rest.managerIds.size > 0) && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                              {rest.managerIds.length || rest.managerIds.size}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setEditingRest(rest)}
                          className="p-1.5 bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-[var(--text-secondary)] rounded-xl text-xs font-bold transition-all"
                          title="Edit Restaurant Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                        </button>

                        <button
                          onClick={() => handleDelete(rest.id, rest.name)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 text-xs font-bold transition-all"
                          title="Delete Restaurant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assign Manager Modal */}
            <AssignManagerModal
              isOpen={!!assignModalRestaurant}
              onClose={() => setAssignModalRestaurant(null)}
              restaurant={assignModalRestaurant}
              onUpdated={() => {
                refetch();
                setAssignModalRestaurant(null);
              }}
            />
    </div>
  );
}
