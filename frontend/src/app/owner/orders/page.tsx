'use client';

import React, { useState, useEffect } from 'react';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetAllUsersQuery } from '@/store/api/userApi';
import {
  useGetRestaurantOrdersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} from '@/store/api/orderApi';
import { OrderManagementView } from '@/components/orders/OrderManagementView';
import toast from 'react-hot-toast';

export default function OwnerOrdersPage() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [page, setPage] = useState(0);

  const { data: restsRes } = useGetMyRestaurantsQuery();
  const restaurants: any[] = restsRes?.data || [];

  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const { data: ordersRes, isLoading, refetch } = useGetRestaurantOrdersQuery(
    { restaurantId: selectedRestaurantId, page, size: 20 },
    { skip: !selectedRestaurantId, pollingInterval: 3000 }
  );

  const { data: usersRes } = useGetAllUsersQuery({ page: 0, size: 100 });

  const [updateStatus] = useUpdateOrderStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allUsers = extractArray(usersRes);
  const orders: any[] = ordersRes?.data?.content || extractArray(ordersRes);
  const totalPages: number = ordersRes?.data?.totalPages || 1;
  const totalElements: number = ordersRes?.data?.totalElements || orders.length;

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateStatus({ orderId, status }).unwrap();
      toast.success(`Order status updated to ${status.replace(/_/g, ' ')}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update order status');
      throw err;
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelOrder({ orderId, reason }).unwrap();
      toast.success('Order cancelled');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel order');
      throw err;
    }
  };

  return (
    <OrderManagementView
      role="RESTAURANT_OWNER"
      pageTitle="Restaurant Order Governance"
      pageSubtitle="Manage live kitchen workflows, item breakdowns, courier assignments, and status overrides."
      restaurants={restaurants}
      selectedRestaurantId={selectedRestaurantId}
      onSelectRestaurantId={(id) => {
        setSelectedRestaurantId(id);
        setPage(0);
      }}
      orders={orders}
      isLoading={isLoading}
      onRefresh={refetch}
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
