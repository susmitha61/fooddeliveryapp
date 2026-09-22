'use client';

import React, { useState } from 'react';
import { useGetRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import {
  useGetAllOrdersQuery,
  useGetRestaurantOrdersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useAssignDriverMutation,
} from '@/store/api/orderApi';
import { OrderManagementView } from '@/components/orders/OrderManagementView';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Queries
  const { data: usersRes } = useGetAllUsersQuery({ page: 0, size: 100 });
  const { data: restaurantsRes } = useGetRestaurantsQuery({ page: 0, size: 100 });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allUsers = extractArray(usersRes);
  const driversList = allUsers.filter((u: any) => u.role === 'DELIVERY_DRIVER');
  const restaurants = extractArray(restaurantsRes);

  // Orders queries
  const {
    data: allOrdersRes,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useGetAllOrdersQuery({ page, size: 20 }, { pollingInterval: 3000 });

  const {
    data: restOrdersRes,
    isLoading: restLoading,
    refetch: refetchRest,
  } = useGetRestaurantOrdersQuery(
    { restaurantId: selectedRestaurantId, page, size: 20 },
    { skip: selectedRestaurantId === 'ALL' || !selectedRestaurantId, pollingInterval: 3000 }
  );

  const [updateStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [assignDriver] = useAssignDriverMutation();

  const activeRes = selectedRestaurantId === 'ALL' ? allOrdersRes : restOrdersRes;
  const orders: any[] = activeRes?.data?.content || extractArray(activeRes);
  const totalPages: number = activeRes?.data?.totalPages || 1;
  const totalElements: number = activeRes?.data?.totalElements || orders.length;
  const isLoading = selectedRestaurantId === 'ALL' ? allLoading : restLoading;

  const handleRefresh = () => {
    refetchAll();
    if (selectedRestaurantId !== 'ALL') {
      refetchRest();
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus }).unwrap();
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      handleRefresh();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update order status');
      throw err;
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelOrder({ orderId, reason }).unwrap();
      toast.success('Order cancelled by Admin');
      handleRefresh();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel order');
      throw err;
    }
  };

  const handleAssignDriver = async (
    orderId: string,
    driver: { driverName: string; driverPhone: string; driverVehicleNumber: string }
  ) => {
    await assignDriver({
      orderId,
      driverName: driver.driverName,
      driverPhone: driver.driverPhone,
      driverVehicleNumber: driver.driverVehicleNumber,
    }).unwrap();
    handleRefresh();
  };

  return (
    <OrderManagementView
      role="ADMIN"
      pageTitle="Admin System Order Governance"
      pageSubtitle="Full administrative control over all system orders, driver assignments, and status overrides."
      restaurants={restaurants}
      selectedRestaurantId={selectedRestaurantId}
      onSelectRestaurantId={(id) => {
        setSelectedRestaurantId(id);
        setPage(0);
      }}
      showAllRestaurantsOption={true}
      orders={orders}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      allUsers={allUsers}
      onUpdateStatus={handleUpdateStatus}
      onCancelOrder={handleCancelOrder}
      onAssignDriver={handleAssignDriver}
      driversList={driversList}
      page={page}
      totalPages={totalPages}
      totalElements={totalElements}
      onPageChange={(p) => setPage(p)}
    />
  );
}
