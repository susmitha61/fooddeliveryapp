'use client';

import React, { useState } from 'react';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { useAssignManagerMutation, useUnassignManagerMutation } from '@/store/api/restaurantApi';
import { Users, X, UserPlus, Trash2, CheckCircle2, ShieldAlert, Store, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: any | null;
  onUpdated?: () => void;
}

export function AssignManagerModal({
  isOpen,
  onClose,
  restaurant,
  onUpdated,
}: AssignManagerModalProps) {
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const { data: usersRes, isLoading: loadingUsers } = useGetAllUsersQuery({ page: 0, size: 100 });
  const [assignManager, { isLoading: isAssigning }] = useAssignManagerMutation();
  const [unassignManager, { isLoading: isUnassigning }] = useUnassignManagerMutation();

  if (!isOpen || !restaurant) return null;

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allUsers = extractArray(usersRes);
  const managers = allUsers.filter(u => u.role === 'MANAGER');

  // Currently assigned manager IDs on this restaurant
  const assignedIds: string[] = Array.isArray(restaurant.managerIds)
    ? restaurant.managerIds
    : restaurant.managerIds instanceof Set
    ? Array.from(restaurant.managerIds)
    : [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManagerId) {
      toast.error('Please select a manager from the user database');
      return;
    }
    if (assignedIds.includes(selectedManagerId)) {
      toast.error('This manager is already assigned to this restaurant');
      return;
    }

    try {
      await assignManager({
        restaurantId: restaurant.id,
        managerId: selectedManagerId,
      }).unwrap();

      toast.success('Manager successfully assigned to restaurant!');
      setSelectedManagerId('');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to assign manager');
    }
  };

  const handleUnassign = async (managerId: string, managerName: string) => {
    if (!confirm(`Are you sure you want to remove manager "${managerName}" from this restaurant?`)) return;

    try {
      await unassignManager({
        restaurantId: restaurant.id,
        managerId,
      }).unwrap();

      toast.success(`Manager "${managerName}" unassigned!`);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to unassign manager');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)]">
                Manage Restaurant Managers
              </h3>
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                <Store className="w-3.5 h-3.5 text-[var(--primary-color)]" />
                <span className="font-semibold text-[var(--text-primary)]">{restaurant.name}</span>
                <span>•</span>
                <span>{[restaurant.area, restaurant.city].filter(Boolean).join(', ')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-[var(--background-color)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently Assigned Managers List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
            <span>Currently Assigned Managers ({assignedIds.length})</span>
            <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Multiple Managers Allowed
            </span>
          </h4>

          {assignedIds.length === 0 ? (
            <div className="p-4 bg-[var(--background-color)] border border-dashed border-[var(--border-color)] rounded-xl text-center">
              <ShieldAlert className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-[var(--text-secondary)]">No managers assigned yet</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Assign a registered manager below to grant them operational access to this restaurant.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl max-h-48 overflow-y-auto bg-[var(--background-color)]">
              {assignedIds.map((mId: string) => {
                const managerObj = allUsers.find(u => (u.id || u.userId) === mId);
                const displayName = managerObj?.name || managerObj?.fullName || `Manager (${mId.slice(-6)})`;
                const displayEmail = managerObj?.email || 'N/A';
                const displayPhone = managerObj?.phone || '';

                return (
                  <div key={mId} className="p-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-color)]/50 transition-colors">
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-[var(--text-primary)] truncate">{displayName}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[var(--primary-color)]" />{displayEmail}</span>
                        {displayPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400" />{displayPhone}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isUnassigning}
                      onClick={() => handleUnassign(mId, displayName)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Unassign this manager"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Unassign</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assign New Manager Form */}
        <form onSubmit={handleAssign} className="pt-2 border-t border-[var(--border-color)] space-y-3">
          <label className="block text-xs font-bold text-[var(--text-secondary)]">
            Select Manager from User DB (Role: MANAGER)
          </label>

          {loadingUsers ? (
            <div className="p-3 bg-[var(--background-color)] rounded-xl animate-pulse text-xs text-center text-[var(--text-muted)]">
              Loading managers from database...
            </div>
          ) : managers.length === 0 ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs space-y-1">
              <p className="font-bold">No registered users with role MANAGER found in main DB.</p>
              <p className="text-[11px] opacity-80">
                Ensure the user registers or is assigned the MANAGER role in the system first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
              >
                <option value="">-- Choose registered manager to assign --</option>
                {managers.map((m: any) => {
                  const isAssigned = assignedIds.includes(m.id || m.userId);
                  return (
                    <option
                      key={m.id || m.userId}
                      value={m.id || m.userId}
                      disabled={isAssigned}
                    >
                      {m.name || m.fullName || 'Manager'} ({m.email}) {isAssigned ? '— [Already Assigned]' : '— [Ready to Assign]'}
                    </option>
                  );
                })}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedManagerId}
                  className="px-5 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAssigning ? 'Assigning...' : 'Assign Manager'}</span>
                </button>
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
