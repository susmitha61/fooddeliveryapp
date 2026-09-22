'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/store/slices/notificationSlice';
import { Badge, LoadingSpinner } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import { useRegisterMutation } from '@/store/api/authApi';
import { useGetRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetOwnerOrdersQuery, useAssignDriverMutation, useUpdateOrderStatusMutation } from '@/store/api/orderApi';
import {
  Truck, Search, UserPlus, Phone, Package, CheckCircle2, RefreshCw,
  ClipboardList, X, Save, ShieldCheck, Mail, Lock, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDriversPage() {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [detailModalDriver, setDetailModalDriver] = useState<any>(null);
  const [reassignDriverId, setReassignDriverId] = useState('');
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null);
  const [selectedDriverForOrder, setSelectedDriverForOrder] = useState<any>(null);
  const [driverVehicle, setDriverVehicle] = useState('MH-01-AB-1234');

  // Add Driver Form State
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const { data: usersRes, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsersQuery({ page: 0, size: 100 }, { pollingInterval: 3000 });
  const { data: restaurantsRes } = useGetRestaurantsQuery({ page: 0, size: 50 });
  const { data: ordersRes, isLoading: ordersLoading, refetch: refetchOrders } = useGetOwnerOrdersQuery({ page: 0, size: 100 }, { pollingInterval: 3000 });
  
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [assignDriver, { isLoading: isAssigningDriver }] = useAssignDriverMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allUsers = extractArray(usersRes);
  const allOrders = extractArray(ordersRes);
  const allRestaurants = extractArray(restaurantsRes);

  const matchDriver = (driver: any, name?: string, phone?: string, id?: string): boolean => {
    if (!driver) return false;
    if (id && (driver.id === id || driver.userId === id)) return true;
    
    const dName = (driver.name || '').trim().toLowerCase();
    const targetName = (name || '').trim().toLowerCase();
    if (dName && targetName && dName === targetName) return true;

    const dPhone = (driver.phone || '').replace(/\D/g, '');
    const targetPhone = (phone || '').replace(/\D/g, '');
    if (dPhone && targetPhone && dPhone === targetPhone) return true;

    return false;
  };

  const getDriverActiveOrder = (driver: any, ordersList: any[]) => {
    if (!driver) return null;

    return ordersList.find((o) => {
      const isAssigned = matchDriver(driver, o.driverName, o.driverPhone, o.driverId);
      const isActiveStatus = !['DELIVERED', 'CANCELLED'].includes(o.status);
      return isAssigned && isActiveStatus;
    }) || null;
  };

  // Filter drivers (role === 'DELIVERY_DRIVER')
  const drivers = allUsers.filter((u) => u.role === 'DELIVERY_DRIVER');

  const filteredDrivers = drivers.filter((d) => {
    return (
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(d.id).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Open orders ready for driver assignment (exclude DELIVERED, CANCELLED, and orders with assigned driver)
  const openOrders = allOrders.filter((o) => {
    return !o.driverName && ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status);
  });

  const resetAddDriverForm = () => {
    setDriverForm({ name: '', email: '', password: '', phone: '' });
    setShowAddDriverModal(false);
  };

  const resetAssignModal = () => {
    setAssignModalOrderId(null);
    setSelectedDriverForOrder(null);
    setDriverVehicle('MH-01-AB-1234');
  };

  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.email.trim() || !driverForm.password) {
      toast.error('Please enter name, email, and password for new driver');
      return;
    }

    try {
      await registerUser({
        name: driverForm.name.trim(),
        email: driverForm.email.trim(),
        password: driverForm.password,
        phone: driverForm.phone.trim() || '9876543210',
        role: 'DELIVERY_DRIVER',
      }).unwrap();

      toast.success(`🎉 Delivery Driver "${driverForm.name}" registered to DB!`);
      resetAddDriverForm();
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.data?.email || 'Failed to register driver');
    }
  };

  const handleAssignOrderToDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalOrderId || !selectedDriverForOrder) return;

    // Single active delivery constraint enforcement
    const activeOrder = getDriverActiveOrder(selectedDriverForOrder, allOrders);
    if (activeOrder) {
      toast.error(
        `Driver "${selectedDriverForOrder.name}" is already busy with Order #${String(activeOrder.id || activeOrder.orderId).slice(-8)}. A courier can only have 1 active delivery at a time.`
      );
      return;
    }

    try {
      await assignDriver({
        orderId: assignModalOrderId,
        driverName: selectedDriverForOrder.name || 'Delivery Courier',
        driverPhone: selectedDriverForOrder.phone || '9876543210',
        driverVehicleNumber: driverVehicle || 'MH-01-AB-1234',
      }).unwrap();

      toast.success(`Order assigned to courier ${selectedDriverForOrder.name || 'Driver'}!`);
      dispatch(
        addNotification({
          title: 'Driver Assigned by Admin',
          message: `Admin assigned Order #${String(assignModalOrderId).slice(-8)} to courier ${selectedDriverForOrder.name || 'Driver'}.`,
          type: 'order',
        })
      );
      resetAssignModal();
      refetchOrders();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to assign driver');
    }
  };

  const handleUnassignDriver = async (orderId: string) => {
    if (!confirm('Are you sure you want to unassign driver from this order?')) return;
    try {
      await assignDriver({
        orderId,
        driverName: '',
        driverPhone: '',
        driverVehicleNumber: '',
      }).unwrap();

      toast.success('Driver unassigned successfully! Driver is now AVAILABLE.');
      dispatch(
        addNotification({
          title: 'Driver Unassigned',
          message: `Driver unassigned from Order #${String(orderId).slice(-8)}. The order is now open for claiming.`,
          type: 'order',
        })
      );
      setDetailModalDriver(null);
      refetchOrders();
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to unassign driver');
    }
  };

  const handleReassignDriver = async (orderId: string, targetDriver: any) => {
    if (!targetDriver) {
      toast.error('Please select a target driver to reassign order to.');
      return;
    }

    // Check if target driver already has active delivery
    const activeOrder = getDriverActiveOrder(targetDriver, allOrders);
    if (activeOrder) {
      toast.error(
        `Target courier "${targetDriver.name}" is already busy with Order #${String(activeOrder.id || activeOrder.orderId).slice(-8)}. Drivers can only handle 1 active order at a time.`
      );
      return;
    }

    try {
      await assignDriver({
        orderId,
        driverName: targetDriver.name || 'Delivery Courier',
        driverPhone: targetDriver.phone || '9876543210',
        driverVehicleNumber: 'MH-01-AB-1234',
      }).unwrap();

      toast.success(`Order reassigned to ${targetDriver.name}!`);
      dispatch(
        addNotification({
          title: 'Order Reassigned by Admin',
          message: `Order #${String(orderId).slice(-8)} was reassigned to courier ${targetDriver.name}.`,
          type: 'order',
        })
      );
      setDetailModalDriver(null);
      setReassignDriverId('');
      refetchOrders();
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reassign driver');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Fleet & Dispatch"
        subtitle="Add new drivers to DB, manage courier fleet, and assign drivers to restaurant orders."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddDriverModal(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Driver to DB</span>
            </button>

            <button
              onClick={() => { refetchUsers(); refetchOrders(); }}
              className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-emerald-500 rounded-xl text-xs font-bold transition-all"
              title="Refresh Fleet Data"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        }
      />

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Truck}
          title="Registered Drivers"
          value={drivers.length}
          accentColor="emerald"
        />
        <StatCard
          icon={Package}
          title="Orders Pending Dispatch"
          value={openOrders.length}
          accentColor="amber"
        />
        <StatCard
          icon={CheckCircle2}
          title="Fleet Status"
          value="Online & Ready"
          accentColor="sky"
        />
      </div>

            {/* Drivers List Header & Search */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-outfit text-xl font-bold">Delivery Courier Fleet ({filteredDrivers.length})</h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search drivers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]">
                  <Truck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <h3 className="font-outfit font-bold text-lg">No Delivery Drivers Registered Yet</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Click "Register New Driver to DB" to create courier accounts.</p>
                  <button
                    onClick={() => setShowAddDriverModal(true)}
                    className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Add First Driver
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDrivers.map((driver) => {
                    const activeAssignedOrder = getDriverActiveOrder(driver, allOrders);
                    const isBusy = !!activeAssignedOrder;

                    return (
                      <div
                        key={driver.id || driver.userId}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full border font-bold flex items-center justify-center shrink-0 ${
                              isBusy ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}>
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-outfit font-bold text-base text-[var(--text-primary)]">
                                {driver.name || 'Courier Driver'}
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)]">{driver.email}</p>
                              {driver.phone && <p className="text-[11px] text-[var(--text-muted)]">📞 {driver.phone}</p>}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {isBusy ? (
                              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                UNAVAILABLE
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                AVAILABLE
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[var(--border-color)]/60">
                          <div>
                            <span className="text-[var(--text-muted)]">User ID:</span>
                            <p className="font-mono font-bold text-[var(--primary-color)]">#{String(driver.id || driver.userId).slice(-8)}</p>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">Active Delivery:</span>
                            <p className={`font-bold ${isBusy ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isBusy ? `Order #${String(activeAssignedOrder.id || activeAssignedOrder.orderId).slice(-8)}` : 'None (Free)'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setDetailModalDriver(driver);
                              setReassignDriverId('');
                            }}
                            className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <ClipboardList className="w-4 h-4" />
                            <span>{isBusy ? 'Manage / Reassign / Unassign Driver' : 'Assign Driver to Open Order'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

        {/* Modal: Add New Driver Form */}
        {showAddDriverModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <span>Register New Delivery Driver to DB</span>
                </h3>
                <button onClick={resetAddDriverForm} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDriverSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Driver Full Name *</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverForm.name}
                    onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Alex Rivers"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Email Address *</label>
                  <input
                    type="email"
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverForm.email}
                    onChange={e => setDriverForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="driver@biterush.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Password *</label>
                  <input
                    type="password"
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverForm.password}
                    onChange={e => setDriverForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Phone Number</label>
                  <input
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverForm.phone}
                    onChange={e => setDriverForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAddDriverForm}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isRegistering ? 'Registering...' : 'Save Driver to DB'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Driver to Restaurant Order */}
        {assignModalOrderId && selectedDriverForOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <span>Assign Courier {selectedDriverForOrder.name}</span>
                </h3>
                <button onClick={resetAssignModal} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAssignOrderToDriver} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Select Open Restaurant Order *</label>
                  <select
                    value={assignModalOrderId}
                    onChange={(e) => setAssignModalOrderId(e.target.value)}
                    className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {openOrders.map((ord) => (
                      <option key={ord.id || ord.orderId} value={ord.id || ord.orderId}>
                        Order #{String(ord.id || ord.orderId).slice(-8)} — {ord.restaurantName || 'Restaurant'} ({ord.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Vehicle License Plate Number *</label>
                  <input
                    className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    placeholder="MH-01-AB-1234"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAssignModal}
                    className="px-4 py-2 bg-[var(--background-color)] text-xs font-bold rounded-xl border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigningDriver}
                    className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-60"
                  >
                    {isAssigningDriver ? 'Assigning...' : 'Confirm Driver Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Driver Detail & Reassign / Unassign */}
        {detailModalDriver && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-lg text-[var(--text-primary)]">
                      {detailModalDriver.name || 'Courier Driver'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">{detailModalDriver.email} · {detailModalDriver.phone || 'No phone'}</p>
                  </div>
                </div>
                <button onClick={() => setDetailModalDriver(null)} className="p-1 text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const activeAssignedOrder = getDriverActiveOrder(detailModalDriver, allOrders);
                const isBusy = !!activeAssignedOrder;

                const availableOtherDrivers = drivers.filter(
                  (d) =>
                    (d.id || d.userId) !== (detailModalDriver.id || detailModalDriver.userId) &&
                    !getDriverActiveOrder(d, allOrders)
                );

                return (
                  <div className="space-y-4">
                    {/* Status Banner */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      isBusy
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <span>Driver Fleet Status:</span>
                      <span>{isBusy ? '⚠️ UNAVAILABLE (Busy on Delivery)' : '✅ AVAILABLE (Free)'}</span>
                    </div>

                    {isBusy && activeAssignedOrder ? (
                      <div className="space-y-3 bg-[var(--background-color)] p-4 rounded-xl border border-[var(--border-color)]">
                        <h4 className="font-outfit font-bold text-xs uppercase text-amber-400 tracking-wider">
                          Currently Assigned Active Order
                        </h4>
                        <div className="text-xs space-y-1 text-[var(--text-secondary)]">
                          <p><strong className="text-[var(--text-primary)]">Order ID:</strong> #{String(activeAssignedOrder.id || activeAssignedOrder.orderId).slice(-8)}</p>
                          <p><strong className="text-[var(--text-primary)]">Restaurant:</strong> {activeAssignedOrder.restaurantName || 'Restaurant'}</p>
                          <p><strong className="text-[var(--text-primary)]">Status:</strong> {activeAssignedOrder.status}</p>
                          <p><strong className="text-[var(--text-primary)]">Destination:</strong> {[activeAssignedOrder.deliveryAddress, activeAssignedOrder.deliveryCity].filter(Boolean).join(', ')}</p>
                        </div>

                        <div className="pt-2 space-y-2 border-t border-[var(--border-color)]">
                          {/* Unassign Driver Button */}
                          <button
                            onClick={() => handleUnassignDriver(activeAssignedOrder.id || activeAssignedOrder.orderId)}
                            className="w-full py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Unassign Driver from Order #{String(activeAssignedOrder.id || activeAssignedOrder.orderId).slice(-8)}</span>
                          </button>

                          {/* Reassign to another driver */}
                          <div className="pt-2 space-y-2">
                            <label className="block text-xs font-bold text-[var(--text-secondary)]">
                              Reassign Order to Another Available Driver:
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={reassignDriverId}
                                onChange={(e) => setReassignDriverId(e.target.value)}
                                className="flex-1 p-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                              >
                                <option value="">-- Choose target free driver --</option>
                                {availableOtherDrivers.map((d) => (
                                  <option key={d.id || d.userId} value={d.id || d.userId}>
                                    {d.name} ({d.email}) — AVAILABLE
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const target = availableOtherDrivers.find((d) => (d.id || d.userId) === reassignDriverId);
                                  handleReassignDriver(activeAssignedOrder.id || activeAssignedOrder.orderId, target);
                                }}
                                disabled={!reassignDriverId}
                                className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 hover:bg-emerald-600 transition-all shadow-md"
                              >
                                Reassign
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-[var(--background-color)] p-4 rounded-xl border border-[var(--border-color)]">
                        <h4 className="font-outfit font-bold text-xs uppercase text-emerald-400 tracking-wider">
                          Assign Free Driver to Open Order
                        </h4>

                        {openOrders.length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)]">No open restaurant orders currently waiting for courier assignment.</p>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-[var(--text-secondary)]">Select Open Order:</label>
                            <select
                              value={assignModalOrderId || ''}
                              onChange={(e) => setAssignModalOrderId(e.target.value)}
                              className="w-full p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">-- Choose unassigned order --</option>
                              {openOrders.map((ord) => (
                                <option key={ord.id || ord.orderId} value={ord.id || ord.orderId}>
                                  Order #{String(ord.id || ord.orderId).slice(-8)} — {ord.restaurantName} ({ord.status})
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={(e) => {
                                setSelectedDriverForOrder(detailModalDriver);
                                handleAssignOrderToDriver(e);
                                setDetailModalDriver(null);
                              }}
                              disabled={!assignModalOrderId}
                              className="w-full py-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 hover:bg-emerald-600 transition-all shadow-md"
                            >
                              Confirm Assignment to {detailModalDriver.name}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
    </div>
  );
}
