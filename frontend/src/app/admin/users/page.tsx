'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useGetAllUsersQuery, useUpdateUserRoleMutation } from '@/store/api/userApi';
import { useRegisterMutation, useToggleActiveMutation } from '@/store/api/authApi';
import {
  Users, Search, ShieldCheck, UserPlus, Edit2, Trash2, X, Save,
  RefreshCw, Power, CheckCircle2, UserCheck, Building2, Bike, Shield
} from 'lucide-react';
import { LoadingSpinner, Badge } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const ROLES = ['ALL', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'];

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [userToToggle, setUserToToggle] = useState<any | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Add User Form State
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
  });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER',
  });

  const { data: usersRes, isLoading, refetch } = useGetAllUsersQuery({ page: 0, size: 100 });
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [toggleActive, { isLoading: isToggling }] = useToggleActiveMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const usersList = extractArray(usersRes);

  const resetAddForm = () => {
    setAddForm({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
    setShowAddModal(false);
  };

  const resetEditForm = () => {
    setEditForm({ id: '', name: '', email: '', phone: '', role: 'CUSTOMER' });
    setEditingUser(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      toast.error('Please complete all required fields');
      return;
    }
    try {
      await registerUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        phone: addForm.phone.trim() || '9876543210',
        role: addForm.role,
      }).unwrap();
      toast.success(`User account "${addForm.name}" created successfully in DB!`);
      resetAddForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.data?.email || 'Failed to create user');
    }
  };

  const handleEditOpen = (u: any) => {
    setEditingUser(u);
    setEditForm({
      id: u.id || u.userId,
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'CUSTOMER',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserRole({ userId: editForm.id, role: editForm.role }).unwrap();
      toast.success(`User role updated to ${editForm.role}!`);
      resetEditForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update user role');
    }
  };

  const handleToggleStatus = (u: any) => {
    setUserToToggle(u);
  };

  const handleConfirmToggle = async () => {
    if (!userToToggle) return;
    const id = userToToggle.id || userToToggle.userId;
    try {
      await toggleActive(id).unwrap();
      toast.success('User active status toggled in DB');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    } finally {
      setUserToToggle(null);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(u.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalCount = usersList.length;
  const customersCount = usersList.filter(u => u.role === 'CUSTOMER').length;
  const ownersCount = usersList.filter(u => u.role === 'RESTAURANT_OWNER').length;
  const driversCount = usersList.filter(u => u.role === 'DELIVERY_DRIVER').length;
  const managersCount = usersList.filter(u => u.role === 'MANAGER').length;
  const adminsCount = usersList.filter(u => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin User Management"
        description="Create, edit, grant permissions, and de-activate accounts across BiteRush."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-lg hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>

            <button
              onClick={() => refetch()}
              className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold flex items-center transition-all"
              title="Refresh User List"
            >
              <RefreshCw className="w-4 h-4 text-[var(--primary-color)]" />
            </button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard title="Total Users" value={totalCount} accentColor="orange" icon={Users} />
        <StatCard title="Customers" value={customersCount} accentColor="sky" icon={UserCheck} />
        <StatCard title="Owners" value={ownersCount} accentColor="amber" icon={Building2} />
        <StatCard title="Drivers" value={driversCount} accentColor="emerald" icon={Bike} />
        <StatCard title="Managers" value={managersCount} accentColor="purple" icon={ShieldCheck} />
        <StatCard title="Admins" value={adminsCount} accentColor="rose" icon={Shield} />
      </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      roleFilter === r
                        ? 'bg-[var(--primary-color)] text-white shadow-md'
                        : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {r.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Users DataTable */}
            {(() => {
              const columns: Column<any>[] = [
                {
                  key: 'id',
                  header: 'User ID',
                  render: (u) => (
                    <span className="font-mono font-bold text-[var(--primary-color)]">
                      #{String(u.id || u.userId).slice(-8)}
                    </span>
                  ),
                },
                {
                  key: 'name',
                  header: 'Name',
                  render: (u) => (
                    <span className="font-semibold text-[var(--text-primary)]">
                      {u.name || u.username || 'User'}
                    </span>
                  ),
                },
                {
                  key: 'email',
                  header: 'Email / Phone',
                  render: (u) => (
                    <div className="text-[var(--text-secondary)]">
                      <p>{u.email}</p>
                      {u.phone && <p className="text-[10px] text-[var(--text-muted)]">{u.phone}</p>}
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Role',
                  render: (u) => (
                    <Badge
                      variant={
                        u.role === 'ADMIN'
                          ? 'danger'
                          : u.role === 'RESTAURANT_OWNER'
                          ? 'warning'
                          : u.role === 'DELIVERY_DRIVER'
                          ? 'success'
                          : u.role === 'MANAGER'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {u.role}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Admin Actions',
                  align: 'right',
                  render: (u) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditOpen(u)}
                        className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                        title="Edit Role & Details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl transition-all"
                        title="Toggle Active / Deactivate"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ];

              return (
                <DataTable
                  columns={columns}
                  data={filteredUsers}
                  keyExtractor={(u) => u.id || u.userId}
                  isLoading={isLoading}
                  emptyIcon={Users}
                  emptyTitle="No Users Found"
                  emptyDescription="Try adjusting your search query or role filter."
                />
              );
            })()}

        {/* Modal: Add New User */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[var(--primary-color)]" />
                  <span>Add New System User</span>
                </h3>
                <button onClick={resetAddForm} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Full Name *</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Email Address *</label>
                  <input
                    type="email"
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Password *</label>
                  <input
                    type="password"
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Phone Number</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Assign System Role *</label>
                  <select
                    value={addForm.role}
                    onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="RESTAURANT_OWNER">RESTAURANT_OWNER</option>
                    <option value="DELIVERY_DRIVER">DELIVERY_DRIVER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAddForm}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isRegistering ? 'Saving...' : 'Save User to DB'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit User Role & Info */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[var(--primary-color)]" />
                  <span>Edit User Permissions</span>
                </h3>
                <button onClick={resetEditForm} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">User Name</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-muted)]"
                    value={editForm.name}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Email</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-muted)]"
                    value={editForm.email}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Assign Role *</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="RESTAURANT_OWNER">RESTAURANT_OWNER</option>
                    <option value="DELIVERY_DRIVER">DELIVERY_DRIVER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetEditForm}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRole}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdatingRole ? 'Updating...' : 'Update Role'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={Boolean(userToToggle)}
          title="Toggle User Status"
          message={`Are you sure you want to toggle the active/inactive status for "${userToToggle?.name || userToToggle?.email}"?`}
          confirmLabel="Toggle Status"
          cancelLabel="Cancel"
          variant="warning"
          isLoading={isToggling}
          onConfirm={handleConfirmToggle}
          onCancel={() => setUserToToggle(null)}
        />
    </div>
  );
}
