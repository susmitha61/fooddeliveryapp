'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { useRegisterMutation } from '@/store/api/authApi';
import { useGetMyRestaurantsQuery, useAssignManagerMutation, useUnassignManagerMutation } from '@/store/api/restaurantApi';
import {
  Users, Search, UserPlus, Phone, Store, CheckCircle2, RefreshCw,
  X, Save, AlertTriangle, Building2, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function OwnerManagersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [assignModalManager, setAssignModalManager] = useState<any>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');

  // Form State
  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const { data: usersRes, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsersQuery(
    { page: 0, size: 100 },
    { pollingInterval: 3000 }
  );
  const { data: myRestaurantsRes, isLoading: restaurantsLoading, refetch: refetchRestaurants } = useGetMyRestaurantsQuery(
    undefined,
    { pollingInterval: 3000 }
  );

  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [assignManager, { isLoading: isAssigning }] = useAssignManagerMutation();
  const [unassignManager, { isLoading: isUnassigning }] = useUnassignManagerMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allUsers = extractArray(usersRes);
  const myRestaurants = extractArray(myRestaurantsRes);

  // Filter managers (role === 'MANAGER')
  const managers = allUsers.filter((u) => u.role === 'MANAGER');

  const filteredManagers = managers.filter((m) => {
    return (
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(m.id || m.userId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.includes(searchTerm))
    );
  });

  // Calculate manager assignments for THIS owner's restaurants
  const getManagerMyRestaurants = (managerId: string) => {
    return myRestaurants.filter((r) => {
      const ids: string[] = Array.isArray(r.managerIds) ? r.managerIds : [];
      return ids.includes(managerId) || r.managerId === managerId;
    });
  };

  const resetAddManagerForm = () => {
    setManagerForm({ name: '', email: '', password: '', phone: '' });
    setShowAddManagerModal(false);
  };

  const handleAddManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerForm.name.trim() || !managerForm.email.trim() || !managerForm.password) {
      toast.error('Please fill in name, email, and password');
      return;
    }

    try {
      await registerUser({
        name: managerForm.name.trim(),
        email: managerForm.email.trim(),
        password: managerForm.password,
        phone: managerForm.phone.trim() || '9876543210',
        role: 'MANAGER',
      }).unwrap();

      toast.success(`🎉 Store Manager "${managerForm.name}" registered to DB!`);
      resetAddManagerForm();
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.data?.email || 'Failed to register manager');
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalManager || !selectedRestaurantId) {
      toast.error('Please select a restaurant to assign');
      return;
    }

    const mgrId = assignModalManager.id || assignModalManager.userId;
    try {
      await assignManager({
        restaurantId: selectedRestaurantId,
        managerId: mgrId,
      }).unwrap();

      const rest = myRestaurants.find((r) => r.id === selectedRestaurantId);
      toast.success(`Assigned ${assignModalManager.name} to "${rest?.name || 'Restaurant'}"!`);
      setSelectedRestaurantId('');
      setAssignModalManager(null);
      refetchRestaurants();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to assign manager');
    }
  };

  const handleUnassign = async (restaurantId: string, managerId: string, managerName: string, restName: string) => {
    if (!confirm(`Unassign manager "${managerName}" from "${restName}"?`)) return;

    try {
      await unassignManager({ restaurantId, managerId }).unwrap();
      toast.success(`Manager unassigned from "${restName}"`);
      refetchRestaurants();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to unassign manager');
    }
  };

  const totalAssignedToMyStores = managers.filter((m) => getManagerMyRestaurants(m.id || m.userId).length > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Management"
        description="Assign trusted managers to oversee your restaurants, live orders, menus, and support."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddManagerModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Manager to DB</span>
            </button>

            <button
              onClick={() => { refetchUsers(); refetchRestaurants(); }}
              className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-amber-500 rounded-xl text-xs font-bold transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Restaurants"
          value={myRestaurants.length}
          icon={Store}
          accentColor="amber"
        />
        <StatCard
          title="Assigned to My Stores"
          value={totalAssignedToMyStores}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Available in Platform"
          value={managers.length}
          icon={Users}
          accentColor="sky"
        />
      </div>

            {/* Manager Roster By Restaurant */}
            <div className="space-y-4">
              <h2 className="font-outfit text-xl font-bold">My Restaurants &amp; Assigned Managers</h2>
              {restaurantsLoading ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner size="md" />
                </div>
              ) : myRestaurants.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
                  You haven&apos;t created any restaurants yet. Go to &quot;My Restaurants&quot; to add your first restaurant.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myRestaurants.map((rest) => {
                    const assignedManagerIds: string[] = Array.isArray(rest.managerIds) ? rest.managerIds : [];
                    if (rest.managerId && !assignedManagerIds.includes(rest.managerId)) {
                      assignedManagerIds.push(rest.managerId);
                    }

                    const assignedManagers = managers.filter((m) =>
                      assignedManagerIds.includes(m.id || m.userId)
                    );

                    return (
                      <div
                        key={rest.id}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                              <Store className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-outfit font-bold text-base text-[var(--text-primary)]">
                                {rest.name}
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {rest.area || rest.city} · {rest.cuisineType || 'Cuisine'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            assignedManagers.length > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {assignedManagers.length} {assignedManagers.length === 1 ? 'Manager' : 'Managers'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[var(--border-color)]/60 space-y-2">
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Assigned Staff:</p>
                          {assignedManagers.length === 0 ? (
                            <p className="text-xs text-[var(--text-muted)] italic">
                              No managers assigned to this store yet.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {assignedManagers.map((mgr) => {
                                const mgrId = mgr.id || mgr.userId;
                                return (
                                  <div
                                    key={mgrId}
                                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span className="font-semibold">{mgr.name}</span>
                                      <span className="text-[11px] text-[var(--text-muted)]">({mgr.email})</span>
                                    </div>
                                    <button
                                      onClick={() => handleUnassign(rest.id, mgrId, mgr.name, rest.name)}
                                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                                      title="Unassign manager"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* All Registered Managers in System */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-outfit text-xl font-bold">All Registered Managers ({filteredManagers.length})</h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search managers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredManagers.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]">
                  <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <h3 className="font-outfit font-bold text-lg">No Managers Found</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Register manager credentials to add to the system.</p>
                  <button
                    onClick={() => setShowAddManagerModal(true)}
                    className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Add First Manager
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredManagers.map((mgr) => {
                    const mgrId = mgr.id || mgr.userId;
                    const assignedStores = getManagerMyRestaurants(mgrId);
                    const isAssigned = assignedStores.length > 0;

                    return (
                      <div
                        key={mgrId}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-amber-500/30 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-outfit font-bold text-base text-[var(--text-primary)]">
                                  {mgr.name || 'Store Manager'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)]">{mgr.email}</p>
                                {mgr.phone && <p className="text-[11px] text-[var(--text-muted)]">📞 {mgr.phone}</p>}
                              </div>
                            </div>

                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                              isAssigned
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}>
                              {isAssigned ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  MANAGING ({assignedStores.length} STORES)
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  NOT ASSIGNED
                                </>
                              )}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[var(--border-color)]/60 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[var(--text-muted)] font-medium">Assigned to My Stores:</span>
                            </div>

                            {assignedStores.length === 0 ? (
                              <p className="text-xs text-[var(--text-muted)] italic">
                                Not assigned to any of your restaurants yet.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {assignedStores.map((store) => (
                                  <div
                                    key={store.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-xs"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span className="font-semibold truncate">{store.name}</span>
                                    </div>
                                    <button
                                      onClick={() => handleUnassign(store.id, mgrId, mgr.name, store.name)}
                                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                                      title="Unassign this store"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setAssignModalManager(mgr);
                              setSelectedRestaurantId('');
                            }}
                            className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>Assign to Another of My Restaurants</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

        {/* Modal: Register New Manager */}
        {showAddManagerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Register Store Manager to DB</span>
                </h3>
                <button onClick={resetAddManagerForm} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddManagerSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Manager Full Name *</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    value={managerForm.name}
                    onChange={e => setManagerForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Rachel Adams"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Email Address *</label>
                  <input
                    type="email"
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    value={managerForm.email}
                    onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="manager@biterush.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Password *</label>
                  <input
                    type="password"
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    value={managerForm.password}
                    onChange={e => setManagerForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Phone Number</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    value={managerForm.phone}
                    onChange={e => setManagerForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAddManagerForm}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isRegistering ? 'Registering...' : 'Save Manager to DB'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Store to Manager */}
        {assignModalManager && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <span>Assign My Restaurant</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Assigning manager: <strong>{assignModalManager.name}</strong>
                  </p>
                </div>
                <button onClick={() => setAssignModalManager(null)} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const mgrId = assignModalManager.id || assignModalManager.userId;
                const assigned = getManagerMyRestaurants(mgrId);
                const assignedIds = new Set(assigned.map((r) => r.id));
                const availableRestaurants = myRestaurants.filter((r) => !assignedIds.has(r.id));

                return (
                  <form onSubmit={handleAssignManager} className="space-y-4">
                    {assigned.length > 0 && (
                      <div className="p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)] space-y-2">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Currently Managing ({assigned.length}):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {assigned.map((st) => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            >
                              <Store className="w-3 h-3" />
                              {st.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                        Select Restaurant to Assign *
                      </label>
                      {availableRestaurants.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">
                          This manager is already assigned to all your restaurants!
                        </p>
                      ) : (
                        <select
                          value={selectedRestaurantId}
                          onChange={(e) => setSelectedRestaurantId(e.target.value)}
                          className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                          required
                        >
                          <option value="">-- Choose restaurant to assign --</option>
                          {availableRestaurants.map((rest) => (
                            <option key={rest.id} value={rest.id}>
                              {rest.name} ({rest.area || rest.city || 'Store'}) — {rest.cuisineType || 'Food'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAssignModalManager(null)}
                        className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isAssigning || !selectedRestaurantId}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAssigning ? 'Assigning...' : 'Confirm Assignment'}</span>
                      </button>
                    </div>
                  </form>
                );
              })()}
            </div>
          </div>
        )}
    </div>
  );
}
