'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { useRegisterMutation } from '@/store/api/authApi';
import { useGetRestaurantsQuery, useAssignManagerMutation, useUnassignManagerMutation } from '@/store/api/restaurantApi';
import {
  Users, Search, UserPlus, Phone, Store, CheckCircle2, RefreshCw,
  X, Save, AlertTriangle, Building2, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function AdminManagersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [assignModalManager, setAssignModalManager] = useState<any>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [unassignTarget, setUnassignTarget] = useState<{
    restaurantId: string;
    managerId: string;
    managerName: string;
    restName: string;
  } | null>(null);

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
  const { data: restaurantsRes, isLoading: restaurantsLoading, refetch: refetchRestaurants } = useGetRestaurantsQuery(
    { page: 0, size: 100 },
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
  const allRestaurants = extractArray(restaurantsRes);

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

  // Calculate manager assignments across restaurants
  const getManagerRestaurants = (managerId: string) => {
    return allRestaurants.filter((r) => {
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

      const rest = allRestaurants.find((r) => r.id === selectedRestaurantId);
      toast.success(`Assigned ${assignModalManager.name} to "${rest?.name || 'Restaurant'}"!`);
      setSelectedRestaurantId('');
      setAssignModalManager(null);
      refetchRestaurants();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to assign manager');
    }
  };

  const handleUnassignClick = (restaurantId: string, managerId: string, managerName: string, restName: string) => {
    setUnassignTarget({ restaurantId, managerId, managerName, restName });
  };

  const handleConfirmUnassign = async () => {
    if (!unassignTarget) return;
    const { restaurantId, managerId, restName } = unassignTarget;
    try {
      await unassignManager({ restaurantId, managerId }).unwrap();
      toast.success(`Manager unassigned from "${restName}"`);
      refetchRestaurants();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to unassign manager');
    } finally {
      setUnassignTarget(null);
    }
  };

  const totalAssignedManagers = managers.filter((m) => getManagerRestaurants(m.id || m.userId).length > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Management"
        description="Register store managers, assign multi-store operations, and manage restaurant delegations."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddManagerModal(true)}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Manager to DB</span>
            </button>

            <button
              onClick={() => { refetchUsers(); refetchRestaurants(); }}
              className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-sky-500 rounded-xl text-xs font-bold transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Registered Managers"
          value={managers.length}
          icon={Users}
          accentColor="sky"
        />
        <StatCard
          title="Assigned to Stores"
          value={totalAssignedManagers}
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Total Restaurants"
          value={allRestaurants.length}
          icon={Building2}
          accentColor="purple"
        />
      </div>

            {/* Search & Managers List */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-outfit text-xl font-bold">Platform Managers ({filteredManagers.length})</h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search managers by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

            {/* Managers DataTable */}
            {(() => {
              const columns: Column<any>[] = [
                {
                  key: 'id',
                  header: 'Manager ID',
                  render: (mgr) => (
                    <span className="font-mono font-bold text-[var(--primary-color)]">
                      #{String(mgr.id || mgr.userId).slice(-8)}
                    </span>
                  ),
                },
                {
                  key: 'name',
                  header: 'Manager Name',
                  render: (mgr) => (
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] block">
                        {mgr.name || 'Store Manager'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">{mgr.email}</span>
                    </div>
                  ),
                },
                {
                  key: 'phone',
                  header: 'Phone',
                  render: (mgr) => (
                    <span className="text-xs text-[var(--text-secondary)]">
                      {mgr.phone ? `📞 ${mgr.phone}` : '—'}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (mgr) => {
                    const assigned = getManagerRestaurants(mgr.id || mgr.userId);
                    const isAssigned = assigned.length > 0;
                    return (
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                          isAssigned
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isAssigned ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            ASSIGNED ({assigned.length})
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            UNASSIGNED
                          </>
                        )}
                      </span>
                    );
                  },
                },
                {
                  key: 'assignedStores',
                  header: 'Assigned Stores',
                  render: (mgr) => {
                    const mgrId = mgr.id || mgr.userId;
                    const assigned = getManagerRestaurants(mgrId);
                    if (assigned.length === 0) {
                      return (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          Not assigned yet
                        </span>
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {assigned.map((store) => (
                          <span
                            key={store.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] text-[11px]"
                          >
                            <Store className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="font-medium text-[var(--text-primary)]">{store.name}</span>
                            <button
                              onClick={() => handleUnassignClick(store.id, mgrId, mgr.name, store.name)}
                              className="text-rose-400 hover:text-rose-300 ml-1 p-0.5 rounded hover:bg-rose-500/10 shrink-0"
                              title={`Unassign from ${store.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  render: (mgr) => (
                    <button
                      onClick={() => {
                        setAssignModalManager(mgr);
                        setSelectedRestaurantId('');
                      }}
                      className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-sky-400 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Delegate Store</span>
                    </button>
                  ),
                },
              ];

              return (
                <DataTable
                  columns={columns}
                  data={filteredManagers}
                  keyExtractor={(mgr) => mgr.id || mgr.userId}
                  isLoading={usersLoading || restaurantsLoading}
                  emptyIcon={Users}
                  emptyTitle="No Managers Found"
                  emptyDescription="Click 'Register New Manager to DB' to create manager accounts."
                />
              );
            })()}
            </div>

        {/* Modal: Register New Manager */}
        {showAddManagerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-400" />
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
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
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
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
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
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
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
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
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
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5"
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
                    <Building2 className="w-5 h-5 text-sky-400" />
                    <span>Assign Restaurant Store</span>
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
                const assigned = getManagerRestaurants(mgrId);
                const assignedIds = new Set(assigned.map((r) => r.id));
                const availableRestaurants = allRestaurants.filter((r) => !assignedIds.has(r.id));

                return (
                  <form onSubmit={handleAssignManager} className="space-y-4">
                    {assigned.length > 0 && (
                      <div className="p-3 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)] space-y-2">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Currently Managing ({assigned.length}):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {assigned.map((st) => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30"
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
                        Select Restaurant to Add *
                      </label>
                      {availableRestaurants.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">
                          This manager is already assigned to all available restaurants in the system!
                        </p>
                      ) : (
                        <select
                          value={selectedRestaurantId}
                          onChange={(e) => setSelectedRestaurantId(e.target.value)}
                          className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-sky-500"
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
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
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

        <ConfirmDialog
          isOpen={Boolean(unassignTarget)}
          title="Unassign Manager"
          message={`Are you sure you want to unassign manager "${unassignTarget?.managerName}" from store "${unassignTarget?.restName}"?`}
          confirmLabel="Unassign Manager"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={isUnassigning}
          onConfirm={handleConfirmUnassign}
          onCancel={() => setUnassignTarget(null)}
        />
    </div>
  );
}
