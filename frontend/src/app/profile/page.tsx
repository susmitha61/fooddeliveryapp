'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppSelector } from '@/store';
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '@/store/api/userApi';
import {
  User, Mail, Phone, MapPin, Plus, Edit2, Trash2, X, Save,
  Star, Camera, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ADDRESS_LABELS = ['HOME', 'WORK', 'OTHER'];

// ─── Address Form ─────────────────────────────────────────────────────────────
function AddressForm({
  initialData, userId, onSave, onCancel, isLoading,
}: {
  initialData?: any; userId: string;
  onSave: (data: any) => void; onCancel: () => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    label: initialData?.label || 'HOME',
    streetAddress: initialData?.streetAddress || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    landmark: initialData?.landmark || '',
    isDefault: initialData?.isDefault || false,
  });

  const inputCls = 'w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors';

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4 p-4 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Label *</label>
          <select className={inputCls} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}>
            {ADDRESS_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Street Address *</label>
          <input className={inputCls} value={form.streetAddress} onChange={e => setForm(f => ({ ...f, streetAddress: e.target.value }))}
            placeholder="Building, Street Name" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">City *</label>
          <input className={inputCls} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="Mumbai" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">State *</label>
          <input className={inputCls} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
            placeholder="Maharashtra" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Pincode *</label>
          <input className={inputCls} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
            placeholder="400001" pattern="[1-9][0-9]{5}" maxLength={6} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Landmark</label>
          <input className={inputCls} value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
            placeholder="Near temple, opposite park..." />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button type="button" onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.isDefault ? 'bg-[var(--primary-color)]' : 'bg-[var(--border-color)]'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isDefault ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs text-[var(--text-secondary)]">Set as Default</span>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-sm font-semibold rounded-xl">
          Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center gap-1.5">
          <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAppSelector(s => s.auth);
  const userId = user?.id || '';
  const role = user?.role || '';

  const [editingProfile, setEditingProfile] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: '', phone: '', bio: '', profilePictureUrl: '',
  });

  const { data: profileRes, isLoading: profileLoading } = useGetUserProfileQuery(userId, { skip: !userId });
  const { data: addressesRes, isLoading: addressesLoading } = useGetAddressesQuery(userId, { skip: !userId });

  const [updateProfile, { isLoading: updatingProfile }] = useUpdateUserProfileMutation();
  const [addAddress, { isLoading: addingAddr }] = useAddAddressMutation();
  const [updateAddress, { isLoading: updatingAddr }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();

  const profile = profileRes?.data;
  const addresses: any[] = addressesRes?.data || [];

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        profilePictureUrl: profile.profilePictureUrl || '',
      });
    }
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ userId, body: profileForm }).unwrap();
      toast.success('Profile updated!');
      setEditingProfile(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddAddress = async (data: any) => {
    try {
      await addAddress({ userId, body: data }).unwrap();
      toast.success('Address added!');
      setAddingAddress(false);
    } catch (err: any) {
      const errors = err?.data?.data;
      if (errors && typeof errors === 'object') toast.error(Object.values(errors)[0] as string);
      else toast.error(err?.data?.message || 'Failed to add address');
    }
  };

  const handleUpdateAddress = async (data: any) => {
    try {
      await updateAddress({ userId, addressId: editingAddress.id || editingAddress.addressId, body: data }).unwrap();
      toast.success('Address updated!');
      setEditingAddress(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await deleteAddress({ userId, addressId }).unwrap();
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefault({ userId, addressId }).unwrap();
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to set default');
    }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors';

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex">
          <RoleSidebar role={role} />
          <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">

            <PageHeader
              title="My Profile"
              subtitle="Manage your personal info and delivery addresses."
            />

            {/* ── Profile Card ── */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6">
              {profileLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-20 w-20 rounded-full bg-[var(--border-color)]" />
                  <div className="h-4 bg-[var(--border-color)] rounded w-1/3" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary-color)]/30 to-[var(--primary-color)] flex items-center justify-center overflow-hidden border-2 border-[var(--primary-color)]/30">
                        {profile?.profilePictureUrl ? (
                          <img src={profile.profilePictureUrl} alt="avatar"
                            className="w-full h-full object-cover"
                            onError={e => (e.currentTarget.style.display = 'none')} />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {(profile?.name || user?.name || 'U')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-outfit font-bold text-xl">{profile?.name || user?.name || 'No Name Set'}</h2>
                      <p className="text-sm text-[var(--text-secondary)]">{profile?.email || user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold border bg-[var(--primary-color)]/15 text-[var(--primary-color)] border-[var(--primary-color)]/30">
                          {role}
                        </span>
                        {profile?.bio && <span className="text-xs text-[var(--text-muted)] italic">{profile.bio}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingProfile(!editingProfile)}
                      className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold flex items-center gap-2 hover:border-[var(--primary-color)] transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  </div>

                  {/* Info */}
                  {!editingProfile && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]">
                        <Mail className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-[var(--text-muted)]">Email</p>
                          <p className="text-xs font-medium truncate">{profile?.email || user?.email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]">
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--text-muted)]">Phone</p>
                          <p className="text-xs font-medium">{profile?.phone || user?.phone || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]">
                        <User className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--text-muted)]">Account</p>
                          <p className="text-xs font-medium">{userId?.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit form */}
                  {editingProfile && (
                    <form onSubmit={handleProfileSave} className="space-y-4 mt-4 border-t border-[var(--border-color)] pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Name</label>
                          <input className={inputCls} value={profileForm.name}
                            onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone</label>
                          <input className={inputCls} value={profileForm.phone}
                            onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" pattern="[6-9]\d{9}" maxLength={10} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Profile Picture URL</label>
                          <input className={inputCls} value={profileForm.profilePictureUrl}
                            onChange={e => setProfileForm(f => ({ ...f, profilePictureUrl: e.target.value }))} placeholder="https://your-image-url.com/avatar.jpg" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Bio</label>
                          <input className={inputCls} value={profileForm.bio}
                            onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} placeholder="A short bio..." maxLength={300} />
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setEditingProfile(false)}
                          className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-sm font-semibold rounded-xl">
                          Cancel
                        </button>
                        <button type="submit" disabled={updatingProfile}
                          className="px-5 py-2 bg-[var(--primary-color)] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center gap-2">
                          <Save className="w-4 h-4" /> {updatingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* ── Addresses ── */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
                <div>
                  <h3 className="font-outfit font-bold">Delivery Addresses</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage your saved delivery locations</p>
                </div>
                {!addingAddress && (
                  <button
                    onClick={() => setAddingAddress(true)}
                    className="px-3 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[var(--primary-hover)] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {addingAddress && (
                  <AddressForm
                    userId={userId}
                    onSave={handleAddAddress}
                    onCancel={() => setAddingAddress(false)}
                    isLoading={addingAddr}
                  />
                )}

                {addressesLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-[var(--border-color)] rounded-xl animate-pulse" />)}
                  </div>
                ) : addresses.length === 0 && !addingAddress ? (
                  <div className="text-center py-8">
                    <MapPin className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No addresses saved yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const addrId = addr.id || addr.addressId;
                      const isEditing = editingAddress?.id === addrId || editingAddress?.addressId === addrId;
                      return (
                        <div key={addrId}>
                          {isEditing ? (
                            <AddressForm
                              initialData={addr}
                              userId={userId}
                              onSave={handleUpdateAddress}
                              onCancel={() => setEditingAddress(null)}
                              isLoading={updatingAddr}
                            />
                          ) : (
                            <div className={`p-4 rounded-xl border transition-all ${
                              addr.isDefault
                                ? 'border-[var(--primary-color)]/40 bg-[var(--primary-color)]/5'
                                : 'border-[var(--border-color)] bg-[var(--background-color)]'
                            }`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    addr.label === 'HOME' ? 'bg-sky-500/15 text-sky-400'
                                    : addr.label === 'WORK' ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-violet-500/15 text-violet-400'
                                  }`}>
                                    {addr.label}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--primary-color)]/15 text-[var(--primary-color)]">
                                      ★ Default
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1.5">
                                  {!addr.isDefault && (
                                    <button onClick={() => handleSetDefault(addrId)}
                                      className="p-1.5 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-400 transition-colors"
                                      title="Set as default">
                                      <Star className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button onClick={() => setEditingAddress(addr)}
                                    className="p-1.5 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteAddress(addrId)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm font-medium">{addr.streetAddress}</p>
                              {addr.landmark && <p className="text-xs text-[var(--text-muted)]">{addr.landmark}</p>}
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
