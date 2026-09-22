import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types';

export const orderApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    /* ─── Cart (X-User-Id header injected by gateway) ─── */

    // GET /api/v1/cart
    getCart: builder.query<ApiResponse<any>, void>({
      query: () => '/api/v1/cart',
      providesTags: ['Cart'],
    }),

    // POST /api/v1/cart/add
    // Body: { restaurantId, restaurantName, itemId, itemName, price, quantity, isVegetarian?, imageUrl?, deliveryFee? }
    addToCart: builder.mutation<ApiResponse<any>, {
      restaurantId: string; restaurantName: string;
      itemId: string; itemName: string;
      price: number; quantity: number;
      isVegetarian?: boolean; imageUrl?: string; deliveryFee?: number;
    }>({
      query: (body) => ({
        url: '/api/v1/cart/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),

    // PATCH /api/v1/cart/items/{cartItemId}?quantity=N
    updateCartItem: builder.mutation<ApiResponse<any>, { cartItemId: string; quantity: number }>({
      query: ({ cartItemId, quantity }) => ({
        url: `/api/v1/cart/items/${cartItemId}?quantity=${quantity}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Cart'],
    }),

    // DELETE /api/v1/cart/items/{cartItemId}
    removeFromCart: builder.mutation<ApiResponse<void>, string>({
      query: (cartItemId) => ({
        url: `/api/v1/cart/items/${cartItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    // DELETE /api/v1/cart (clear entire cart)
    clearCartApi: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/api/v1/cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    /* ─── Orders ─── */

    // POST /api/v1/orders/place
    // Body: { deliveryAddress, deliveryCity, deliveryArea?, deliveryPincode, paymentMethod, specialInstructions? }
    placeOrder: builder.mutation<ApiResponse<any>, {
      deliveryAddress: string;
      deliveryCity: string;
      deliveryArea?: string;
      deliveryPincode: string;
      paymentMethod: string;
      specialInstructions?: string;
    }>({
      query: (body) => ({
        url: '/api/v1/orders/place',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),

    // Alias for components using createOrder
    createOrder: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({
        url: '/api/v1/orders/place',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),

    // GET /api/v1/orders/{orderId}
    getOrderById: builder.query<ApiResponse<any>, string>({
      query: (orderId) => `/api/v1/orders/${orderId}`,
      providesTags: ['Order'],
    }),

    // GET /api/v1/orders/my-orders?page=X&size=Y
    getMyOrders: builder.query<ApiResponse<any>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) => `/api/v1/orders/my-orders?page=${page}&size=${size}`,
      providesTags: ['Order'],
    }),

    // GET /api/v1/orders/restaurant/{restaurantId}?page=X&size=Y — RESTAURANT_OWNER
    getRestaurantOrders: builder.query<ApiResponse<any>, { restaurantId: string; page?: number; size?: number }>({
      query: ({ restaurantId, page = 0, size = 10 }) => `/api/v1/orders/restaurant/${restaurantId}?page=${page}&size=${size}`,
      providesTags: ['Order'],
    }),

    // GET /api/v1/orders/all?page=X&size=Y — ADMIN / DRIVER / MANAGEMENT
    getAllOrders: builder.query<ApiResponse<any>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 50 } = {}) => `/api/v1/orders/all?page=${page}&size=${size}`,
      providesTags: ['Order'],
    }),

    // Alias for owner / admin pages
    getOwnerOrders: builder.query<ApiResponse<any>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 50 } = {}) => `/api/v1/orders/all?page=${page}&size=${size}`,
      providesTags: ['Order'],
    }),

    // For driver deliveries
    getDriverDeliveries: builder.query<ApiResponse<any>, void>({
      query: () => '/api/v1/orders/all?page=0&size=50',
      providesTags: ['Order'],
    }),

    getDriverOrders: builder.query<ApiResponse<any>, { page?: number; size?: number } | void>({
      query: (params) => {
        const page = (params && typeof params === 'object' && params.page) || 0;
        const size = (params && typeof params === 'object' && params.size) || 50;
        return `/api/v1/orders/all?page=${page}&size=${size}`;
      },
      providesTags: ['Order'],
    }),

    // PATCH /api/v1/orders/{orderId}/status?status=X
    updateOrderStatus: builder.mutation<ApiResponse<any>, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/api/v1/orders/${orderId}/status?status=${status}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Order'],
    }),

    // Alias for delivery status updates
    updateDeliveryStatus: builder.mutation<ApiResponse<any>, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/api/v1/orders/${orderId}/status?status=${status}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Order'],
    }),

    // PATCH /api/v1/orders/{orderId}/cancel?reason=X
    cancelOrder: builder.mutation<ApiResponse<any>, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({
        url: `/api/v1/orders/${orderId}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Order'],
    }),

    /* ─── Tracking ─── */

    // GET /api/v1/tracking/{orderId}
    trackOrder: builder.query<ApiResponse<any>, string>({
      query: (orderId) => `/api/v1/tracking/${orderId}`,
      providesTags: ['Order'],
    }),

    // GET /api/v1/tracking/my-active
    getActiveTracking: builder.query<ApiResponse<any>, void>({
      query: () => '/api/v1/tracking/my-active',
      providesTags: ['Order'],
    }),

    // PATCH /api/v1/tracking/internal/{orderId}/assign-driver
    assignDriver: builder.mutation<ApiResponse<any>, {
      orderId: string;
      driverName: string;
      driverPhone?: string;
      driverVehicleNumber?: string;
    }>({
      query: ({ orderId, driverName, driverPhone = '9876543210', driverVehicleNumber = 'MH-01-AB-1234' }) => ({
        url: `/api/v1/tracking/internal/${orderId}/assign-driver`,
        method: 'PATCH',
        params: { driverName, driverPhone, vehicleNumber: driverVehicleNumber },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartApiMutation,
  usePlaceOrderMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetRestaurantOrdersQuery,
  useGetAllOrdersQuery,
  useGetOwnerOrdersQuery,
  useGetDriverDeliveriesQuery,
  useGetDriverOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateDeliveryStatusMutation,
  useCancelOrderMutation,
  useTrackOrderQuery,
  useGetActiveTrackingQuery,
  useAssignDriverMutation,
} = orderApi;

// Aliases for backward compatibility with components
export const useRemoveCartItemMutation = useRemoveFromCartMutation;
export const useClearCartMutation = useClearCartApiMutation;
