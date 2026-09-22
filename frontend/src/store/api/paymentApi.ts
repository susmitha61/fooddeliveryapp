import { baseApi } from './baseApi';
import type { ApiResponse, PageResponse, Payment, InitiatePaymentRequest } from '@/types';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<ApiResponse<Payment>, InitiatePaymentRequest>({
      query: (body) => ({ url: '/api/v1/payments/initiate', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),

    confirmPayment: builder.mutation<ApiResponse<Payment>, { paymentId: string; transactionRef: string }>({
      query: ({ paymentId, transactionRef }) => ({
        url: `/api/v1/payments/${paymentId}/confirm`,
        method: 'PATCH',
        params: { transactionRef },
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),

    failPayment: builder.mutation<ApiResponse<Payment>, { paymentId: string; reason: string }>({
      query: ({ paymentId, reason }) => ({
        url: `/api/v1/payments/${paymentId}/fail`,
        method: 'PATCH',
        params: { reason },
      }),
      invalidatesTags: ['Payment'],
    }),

    getPayment: builder.query<ApiResponse<Payment>, string>({
      query: (paymentId) => `/api/v1/payments/${paymentId}`,
      providesTags: ['Payment'],
    }),

    getPaymentByOrder: builder.query<ApiResponse<Payment>, string>({
      query: (orderId) => `/api/v1/payments/order/${orderId}`,
      providesTags: ['Payment'],
    }),

    getMyPayments: builder.query<ApiResponse<PageResponse<Payment>>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) =>
        `/api/v1/payments/my-payments?page=${page}&size=${size}`,
      providesTags: ['Payment'],
    }),

    processRefund: builder.mutation<ApiResponse<Payment>, { orderId: string; reason?: string }>({
      query: ({ orderId, reason = 'Order cancelled' }) => ({
        url: `/api/v1/payments/refund/${orderId}`,
        method: 'POST',
        params: { reason },
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),

    markCodPaid: builder.mutation<ApiResponse<Payment>, string>({
      query: (orderId) => ({
        url: `/api/v1/payments/cod/${orderId}/mark-paid`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),

    // Mock payment processor for demo — calls confirm endpoint with a fake transaction ref
    processMockPayment: builder.mutation<ApiResponse<Payment>, { paymentId: string; status: string }>({
      query: ({ paymentId, status }) => ({
        url: `/api/v1/payments/${paymentId}/confirm`,
        method: 'PATCH',
        params: { transactionRef: `MOCK_${Date.now()}_${status}` },
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useConfirmPaymentMutation,
  useFailPaymentMutation,
  useGetPaymentQuery,
  useGetPaymentByOrderQuery,
  useGetMyPaymentsQuery,
  useProcessRefundMutation,
  useMarkCodPaidMutation,
  useProcessMockPaymentMutation,
} = paymentApi;

