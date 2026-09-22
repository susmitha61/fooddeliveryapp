'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { AddressForm, AddressFormData } from '@/components/user/AddressForm';
import { useAppSelector } from '@/store';
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '@/store/api/userApi';
import { MapPin, Plus, Edit2, Trash2, Star, Home, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StandaloneAddressesPage() {
  const { user } = useAppSelector((s) => s.auth);
  const userId = user?.id || (user as any)?.userId || '';
  const role = user?.role || 'CUSTOMER';

  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const { data: addressesRes, isLoading: addressesLoading } = useGetAddressesQuery(userId, {
    skip: !userId,
  });

  const [addAddress, { isLoading: addingAddr }] = useAddAddressMutation();
  const [updateAddress, { isLoading: updatingAddr }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    return [];
  };

  const addresses = extractArray(addressesRes);

  const handleAddAddress = async (data: AddressFormData) => {
    try {
      await addAddress({ userId, body: data }).unwrap();
      toast.success('Address saved successfully!');
      setAddingAddress(false);
    } catch (err: any) {
      const errors = err?.data?.data;
      if (errors && typeof errors === 'object') {
        toast.error(Object.values(errors)[0] as string);
      } else {
        toast.error(err?.data?.message || 'Failed to add address');
      }
    }
  };

  const handleUpdateAddress = async (data: AddressFormData) => {
    const addressId = editingAddress.id || editingAddress.addressId;
    try {
      await updateAddress({ userId, addressId, body: data }).unwrap();
      toast.success('Address updated!');
      setEditingAddress(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
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
      toast.error('Failed to set default address');
    }
  };

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={role} />

          <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
            <PageHeader
              title="Saved Delivery Addresses"
              subtitle="Manage and organize your delivery locations for faster checkout."
              actions={
                !addingAddress && (
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setAddingAddress(true);
                    }}
                    className="px-4 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                )
              }
            />

            {/* Stat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Saved Addresses" value={addresses.length} icon={MapPin} />
              <StatCard
                title="Primary Location"
                value={addresses.find((a) => a.isDefault)?.city || 'None set'}
                icon={Home}
                colorClass="text-sky-400"
              />
              <StatCard
                title="Work/Other"
                value={addresses.filter((a) => a.label !== 'HOME').length}
                icon={Briefcase}
                colorClass="text-amber-400"
              />
            </div>

            {/* Adding Address Inline Form */}
            {addingAddress && (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                <h3 className="font-outfit font-bold text-base mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--primary-color)]" />
                  <span>Add New Delivery Address</span>
                </h3>
                <AddressForm
                  userId={userId}
                  onSave={handleAddAddress}
                  onCancel={() => setAddingAddress(false)}
                  isLoading={addingAddr}
                />
              </div>
            )}

            {/* Addresses List */}
            {addressesLoading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : addresses.length === 0 && !addingAddress ? (
              <EmptyState
                icon={MapPin}
                title="No Addresses Saved"
                description="You haven't saved any delivery addresses yet. Add one to enable 1-click checkout."
                action={
                  <button
                    onClick={() => setAddingAddress(true)}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl"
                  >
                    Add Your First Address
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const addrId = addr.id || addr.addressId;
                  const isEditing = editingAddress?.id === addrId || editingAddress?.addressId === addrId;

                  if (isEditing) {
                    return (
                      <div
                        key={addrId}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm"
                      >
                        <h3 className="font-outfit font-bold text-base mb-4 flex items-center gap-2">
                          <Edit2 className="w-4 h-4 text-[var(--primary-color)]" />
                          <span>Edit Address</span>
                        </h3>
                        <AddressForm
                          initialData={addr}
                          userId={userId}
                          onSave={handleUpdateAddress}
                          onCancel={() => setEditingAddress(null)}
                          isLoading={updatingAddr}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={addrId}
                      className={`p-5 rounded-2xl border transition-all ${
                        addr.isDefault
                          ? 'border-[var(--primary-color)]/40 bg-[var(--surface-color)] shadow-sm'
                          : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--border-color)]/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                                addr.label === 'HOME'
                                  ? 'bg-sky-500/15 text-sky-400'
                                  : addr.label === 'WORK'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-violet-500/15 text-violet-400'
                              }`}
                            >
                              {addr.label === 'WORK' ? (
                                <Briefcase className="w-3 h-3" />
                              ) : (
                                <Home className="w-3 h-3" />
                              )}
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[var(--primary-color)]/15 text-[var(--primary-color)]">
                                ★ Default Address
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {addr.streetAddress}
                          </p>
                          {addr.landmark && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Near {addr.landmark}
                            </p>
                          )}
                          <p className="text-xs text-[var(--text-secondary)]">
                            {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefault(addrId)}
                              className="p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400/40 transition-colors"
                              title="Set as default address"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setAddingAddress(false);
                              setEditingAddress(addr);
                            }}
                            className="p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)]/40 transition-colors"
                            title="Edit Address"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addrId)}
                            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
