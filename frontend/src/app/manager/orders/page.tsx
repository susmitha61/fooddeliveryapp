'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import {
  useGetRestaurantOrdersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} from '@/store/api/orderApi';
import { LoadingSpinner } from '@/components/ui/Modal';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { ManagerStoreSwitcher } from '@/components/manager/ManagerStoreSwitcher';
import { OrderManagementView } from '@/components/orders/OrderManagementView';
import toast from 'react-hot-toast';

export default function ManagerOrdersPage() {
  const [selectedRestId, setSelectedRestId] = useState('');
  const [page, setPage] = useState(0);
  const { user } = useAppSelector((s) => s.auth);
  const isManager = user?.role === 'MANAGER';

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  // Fetch Manager's assigned restaurants
  const { data: myRestaurantsRes, isLoading: myRestsLoading, refetch: refetchMyRests } = useGetMyRestaurantsQuery();
  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  // Selected restaurant ID
  const currentRestaurantId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  useEffect(() => {
    if (myRestaurants.length > 0 && !selectedRestId) {
      setSelectedRestId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedRestId]);

  // Fetch all users to resolve customer and courier details
  const { data: usersRes } = useGetAllUsersQuery({ page: 0, size: 100 });

  // Query orders for the selected assigned restaurant with 3000ms live sync
  const { data: ordersRes, isLoading: ordersLoading, refetch: refetchOrders } = useGetRestaurantOrdersQuery(
    { restaurantId: currentRestaurantId, page, size: 20 },
    { pollingInterval: 3000, skip: !currentRestaurantId }
  );

  const [updateStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();

  const allUsers = extractArray(usersRes);
  const orders: any[] = ordersRes?.data?.content || extractArray(ordersRes);
  const totalPages: number = ordersRes?.data?.totalPages || 1;
  const totalElements: number = ordersRes?.data?.totalElements || orders.length;

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus }).unwrap();
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      refetchOrders();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update order status');
      throw err;
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelOrder({ orderId, reason }).unwrap();
      toast.success('Order cancelled successfully');
      refetchOrders();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel order');
      throw err;
    }
  };

  if (isManager && myRestsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
      </div>
    );
  }

  if (isManager && !hasAssociatedRestaurant) {
    return <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Manager Order Hub" />;
  }

  return (
    <OrderManagementView
      role="MANAGER"
      pageTitle="Manager Order Hub"
      pageSubtitle="Manage live kitchen workflows, item breakdowns, courier assignments, and status overrides for your assigned restaurants."
      restaurants={myRestaurants}
      selectedRestaurantId={currentRestaurantId}
      onSelectRestaurantId={(id) => {
        setSelectedRestId(id);
        setPage(0);
      }}
      customStoreSwitcher={
        myRestaurants.length > 1 ? (
          <ManagerStoreSwitcher
            restaurants={myRestaurants}
            selectedRestaurantId={currentRestaurantId}
            onSelectRestaurantId={(id) => {
              setSelectedRestId(id);
              setPage(0);
            }}
          />
        ) : null
      }
      orders={orders}
      isLoading={ordersLoading}
      onRefresh={refetchOrders}
      allUsers={allUsers}
      onUpdateStatus={handleUpdateStatus}
      onCancelOrder={handleCancelOrder}
      page={page}
      totalPages={totalPages}
      totalElements={totalElements}
      onPageChange={(p) => setPage(p)}
    />
  );
}
