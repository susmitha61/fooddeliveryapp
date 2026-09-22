'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/Modal';
import {
  useGetMyRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useToggleOpenMutation,
  useDeleteRestaurantMutation,
} from '@/store/api/restaurantApi';
import {
  Store, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  MapPin, Phone, Mail, Clock, Star, X, Save, Image as ImageIcon, Upload, Users,
} from 'lucide-react';
import { AssignManagerModal } from '@/components/restaurants/AssignManagerModal';
import { RestaurantRatingBadge } from '@/components/ui/RestaurantRatingBadge';
import toast from 'react-hot-toast';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'ALL_DAY'];
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
  mealTypes: [], streetAddress: '', area: '',
  city: '', state: '', pincode: '',
  phone: '', email: '',
  openingTime: '09:00', closingTime: '22:00',
  deliveryFee: '', minimumOrderAmount: '',
  isPureVeg: false, imageUrl: '',
};

function RestaurantForm({
  initialData, onSave, onCancel, isLoading,
}: {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<RestaurantFormData>(() => {
    if (!initialData) return EMPTY_FORM;
    return {
      name: initialData.name || '',
      description: initialData.description || '',
      cuisineType: initialData.cuisineType || '',
      mealTypes: initialData.mealTypes || [],
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

  const toggleMealType = (type: string) => {
    set('mealTypes', form.mealTypes.includes(type)
      ? form.mealTypes.filter(t => t !== type)
      : [...form.mealTypes, type]);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        set('imageUrl', reader.result as string);
        toast.success('Image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error('Phone must be a valid 10-digit Indian mobile number');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) {
      toast.error('Pincode must be a valid 6-digit Indian pincode');
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
      {/* Basic Info */}
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl">
        <h3 className="font-outfit font-bold text-sm mb-4 text-[var(--primary-color)]">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Restaurant Name *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. The Spice Garden" required minLength={2} maxLength={150} />
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
              rows={2} placeholder="Brief description of your restaurant..." maxLength={500} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="restaurant@example.com" />
          </div>
          <div>
            <label className={labelCls}>Restaurant Image (URL or File Upload)</label>
            <div className="space-y-2">
              <input className={inputCls} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
                placeholder="https://your-image-url.com/photo.jpg" />
              <label className="flex items-center gap-2 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--primary-color)] cursor-pointer transition-all w-fit">
                <Upload className="w-4 h-4 text-[var(--primary-color)]" /> Upload Image File
                <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
              </label>
            </div>
          </div>
          {form.imageUrl && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Image Preview</label>
              <img src={form.imageUrl} alt="Preview" onError={e => (e.currentTarget.style.display='none')}
                className="h-28 w-48 object-cover rounded-xl border border-[var(--border-color)]" />
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl">
        <h3 className="font-outfit font-bold text-sm mb-4 text-[var(--primary-color)]">
          Address
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Street Address *</label>
            <input className={inputCls} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)}
              placeholder="Building, Street Name" required maxLength={300} />
          </div>
          <div>
            <label className={labelCls}>Area *</label>
            <input className={inputCls} value={form.area} onChange={e => set('area', e.target.value)}
              placeholder="Area / Locality" required maxLength={100} />
          </div>
          <div>
            <label className={labelCls}>City *</label>
            <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="Mumbai" required maxLength={100} />
          </div>
          <div>
            <label className={labelCls}>State *</label>
            <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value)}
              placeholder="Maharashtra" required maxLength={100} />
          </div>
          <div>
            <label className={labelCls}>Pincode *</label>
            <input className={inputCls} value={form.pincode} onChange={e => set('pincode', e.target.value)}
              placeholder="400001" pattern="[1-9][0-9]{5}" maxLength={6} required />
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl">
        <h3 className="font-outfit font-bold text-sm mb-4 text-[var(--primary-color)]">
          Operations & Pricing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Opening Time</label>
            <input type="time" className={inputCls} value={form.openingTime} onChange={e => set('openingTime', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Closing Time</label>
            <input type="time" className={inputCls} value={form.closingTime} onChange={e => set('closingTime', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Delivery Fee (₹)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.deliveryFee}
              onChange={e => set('deliveryFee', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Minimum Order Amount (₹)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.minimumOrderAmount}
              onChange={e => set('minimumOrderAmount', e.target.value)} placeholder="0.00" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Meal Types Served</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MEAL_TYPES.map(type => (
                <button type="button" key={type} onClick={() => toggleMealType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    form.mealTypes.includes(type)
                      ? 'bg-[var(--primary-color)] text-white border-transparent'
                      : 'bg-[var(--background-color)] border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}>
                  {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex items-center gap-3 mt-1">
            <button type="button" onClick={() => set('isPureVeg', !form.isPureVeg)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.isPureVeg ? 'bg-emerald-500' : 'bg-[var(--border-color)]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${form.isPureVeg ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm font-medium">Pure Vegetarian Restaurant</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] text-sm font-semibold rounded-xl hover:border-[var(--primary-color)] transition-all flex items-center gap-2">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="px-6 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : initialData ? 'Update Restaurant' : 'Create Restaurant'}
        </button>
      </div>
    </form>
  );
}

function OwnerRestaurantsContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [assignModalRestaurant, setAssignModalRestaurant] = useState<any | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: res, isLoading, refetch } = useGetMyRestaurantsQuery();
  const [createRestaurant, { isLoading: creating }] = useCreateRestaurantMutation();
  const [updateRestaurant, { isLoading: updating }] = useUpdateRestaurantMutation();
  const [toggleOpen] = useToggleOpenMutation();
  const [deleteRestaurant] = useDeleteRestaurantMutation();

  const restaurants: any[] = res?.data || [];

  // Handle ?edit=id from query param
  useEffect(() => {
    const editId = searchParams?.get('edit');
    if (editId && restaurants.length > 0) {
      const r = restaurants.find(r => r.id === editId);
      if (r) { setEditingRestaurant(r); setShowForm(true); }
    }
  }, [searchParams, restaurants]);

  const handleSave = async (formData: any) => {
    try {
      if (editingRestaurant) {
        await updateRestaurant({ id: editingRestaurant.id, body: formData }).unwrap();
        toast.success('Restaurant updated successfully!');
      } else {
        await createRestaurant(formData).unwrap();
        toast.success('Restaurant created! Pending admin approval.');
      }
      setShowForm(false);
      setEditingRestaurant(null);
      router.replace('/owner/restaurants');
    } catch (err: any) {
      const errors = err?.data?.data;
      if (errors && typeof errors === 'object') {
        toast.error(Object.values(errors)[0] as string);
      } else {
        toast.error(err?.data?.message || 'Failed to save restaurant');
      }
    }
  };

  const handleToggle = async (id: string, name: string) => {
    try {
      await toggleOpen(id).unwrap();
      toast.success(`${name} status toggled`);
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteRestaurant(id).unwrap();
      toast.success(`${name} deleted`);
    } catch {
      toast.error('Failed to delete restaurant');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Restaurants"
        description="Create, manage and configure your restaurant listings."
        actions={
          !showForm ? (
            <button
              onClick={() => { setEditingRestaurant(null); setShowForm(true); }}
              className="px-4 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:bg-[var(--primary-hover)] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Restaurant
            </button>
          ) : null
        }
      />

            {/* Form */}
            {showForm && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-outfit font-bold text-xl">
                    {editingRestaurant ? `Edit: ${editingRestaurant.name}` : 'Create New Restaurant'}
                  </h2>
                </div>
                <RestaurantForm
                  initialData={editingRestaurant}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditingRestaurant(null); router.replace('/owner/restaurants'); }}
                  isLoading={creating || updating}
                />
              </div>
            )}

            {/* Restaurant List */}
            {!showForm && (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[1,2].map(i => (
                      <div key={i} className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl animate-pulse h-32" />
                    ))}
                  </div>
                ) : restaurants.length === 0 ? (
                  <div className="text-center p-12 bg-[var(--surface-color)] border border-dashed border-[var(--border-color)] rounded-3xl">
                    <Store className="w-14 h-14 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="font-outfit font-bold text-xl mb-2">No Restaurants Yet</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                      Add your first restaurant to start managing orders.
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary-color)] text-white font-semibold text-sm rounded-xl"
                    >
                      <Plus className="w-4 h-4" /> Add Restaurant
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {restaurants.map((r) => (
                      <div key={r.id} className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Image */}
                          {r.imageUrl && (
                            <img src={r.imageUrl} alt={r.name}
                              className="w-full sm:w-28 h-28 object-cover rounded-xl border border-[var(--border-color)] shrink-0" />
                          )}
                          {!r.imageUrl && (
                            <div className="w-28 h-28 rounded-xl border border-dashed border-[var(--border-color)] flex items-center justify-center shrink-0">
                              <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-outfit font-bold text-lg">{r.name}</h3>
                                <p className="text-xs text-[var(--text-secondary)]">{r.cuisineType}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`text-[11px] px-2 py-1 rounded-full font-semibold border ${
                                  r.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : r.status === 'SUSPENDED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}>
                                  {r.status || 'PENDING_APPROVAL'}
                                </span>
                                <span className={`text-[11px] px-2 py-1 rounded-full font-semibold border ${
                                  r.isOpen ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                }`}>
                                  {r.isOpen ? '● Open' : '○ Closed'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] mb-3">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {[r.area, r.city, r.state].filter(Boolean).join(', ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {r.phone}
                              </span>
                              {r.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {r.email}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {r.openingTime} – {r.closingTime}
                              </span>
                              <RestaurantRatingBadge
                                restaurantId={r.id}
                                initialRating={r.rating}
                                initialCount={r.totalRatings}
                                showCount
                              />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleToggle(r.id, r.name)}
                                className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:border-[var(--primary-color)] transition-all"
                              >
                                {r.isOpen ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                {r.isOpen ? 'Close' : 'Open'}
                              </button>
                              <button
                                onClick={() => setAssignModalRestaurant(r)}
                                className="px-3 py-1.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/30 hover:bg-[var(--primary-color)] hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Assign Manager</span>
                                {r.managerIds && (r.managerIds.length > 0 || r.managerIds.size > 0) && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-[var(--primary-color)] text-white text-[10px] font-bold">
                                    {r.managerIds.length || r.managerIds.size}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => { setEditingRestaurant(r); setShowForm(true); }}
                                className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:border-[var(--primary-color)] transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(r.id, r.name)}
                                className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-rose-500/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
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

export default function OwnerRestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center">
          <LoadingSpinner className="py-20" />
        </div>
      }
    >
      <OwnerRestaurantsContent />
    </Suspense>
  );
}
