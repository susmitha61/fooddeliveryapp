import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types';

export const supportApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // GET /api/v1/support/tickets/my-tickets  — authenticated user's tickets
    getMyTickets: builder.query<ApiResponse<any>, void>({
      query: () => '/api/v1/support/tickets/my-tickets',
      providesTags: ['Support'],
    }),

    // POST /api/v1/support/tickets
    // TicketRequest: { category, orderId?, restaurantId?, subject, description }
    // category enum: ORDER_ISSUE | PAYMENT_ISSUE | DELIVERY_ISSUE | FOOD_QUALITY | APP_ISSUE | ACCOUNT_ISSUE | REFUND_REQUEST | OTHER
    createTicket: builder.mutation<ApiResponse<any>, {
      category: string;
      subject: string;
      description: string;
      orderId?: string;
      restaurantId?: string;
    }>({
      query: (body) => ({ url: '/api/v1/support/tickets', method: 'POST', body }),
      invalidatesTags: ['Support'],
    }),

    // GET /api/v1/support/tickets/{ticketId}
    getTicket: builder.query<ApiResponse<any>, string>({
      query: (id) => `/api/v1/support/tickets/${id}`,
      providesTags: ['Support'],
    }),

    // PATCH /api/v1/support/tickets/{ticketId}/close
    closeTicket: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({ url: `/api/v1/support/tickets/${id}/close`, method: 'PATCH' }),
      invalidatesTags: ['Support'],
    }),

    // POST /api/v1/support/tickets/{ticketId}/reply  — user reply
    replyToTicket: builder.mutation<ApiResponse<any>, { ticketId: string; message: string }>({
      query: ({ ticketId, message }) => ({
        url: `/api/v1/support/tickets/${ticketId}/reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Support'],
    }),

    // GET /api/v1/support/tickets — ADMIN/MANAGER only; all tickets with optional ?status=&page=&size=
    getAllTickets: builder.query<ApiResponse<any>, { status?: string; page?: number; size?: number }>({
      query: ({ status, page = 0, size = 20 } = {}) => ({
        url: '/api/v1/support/tickets',
        params: { ...(status ? { status } : {}), page, size },
      }),
      providesTags: ['Support'],
    }),

    // PATCH /api/v1/support/tickets/{ticketId}  — ADMIN/MANAGER: update status/priority/resolution
    updateTicket: builder.mutation<ApiResponse<any>, {
      ticketId: string;
      status?: string;
      priority?: string;
      resolutionNote?: string;
    }>({
      query: ({ ticketId, ...body }) => ({
        url: `/api/v1/support/tickets/${ticketId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Support'],
    }),

    // POST /api/v1/support/tickets/{ticketId}/agent-reply  — ADMIN/MANAGER
    agentReply: builder.mutation<ApiResponse<any>, { ticketId: string; message: string }>({
      query: ({ ticketId, message }) => ({
        url: `/api/v1/support/tickets/${ticketId}/agent-reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Support'],
    }),

    // DELETE /api/v1/support/tickets/{ticketId}  — ADMIN only
    deleteTicket: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/api/v1/support/tickets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Support'],
    }),

    // ─── Reviews ────────────────────────────────────────────────────────────────
    // GET /api/v1/reviews/restaurant/{restaurantId}
    getRestaurantReviews: builder.query<ApiResponse<any>, string>({
      query: (restaurantId) => `/api/v1/reviews/restaurant/${restaurantId}`,
      providesTags: ['Review'],
    }),

    // GET /api/v1/reviews/my-reviews
    getMyReviews: builder.query<ApiResponse<any>, void>({
      query: () => '/api/v1/reviews/my-reviews',
      providesTags: ['Review'],
    }),

    // POST /api/v1/reviews
    // ReviewRequest: { reviewType, orderId, restaurantId, menuItemId?, menuItemName?, rating, title?, comment? }
    createReview: builder.mutation<ApiResponse<any>, {
      reviewType: 'RESTAURANT' | 'MENU_ITEM';
      orderId: string;
      restaurantId: string;
      menuItemId?: string;
      menuItemName?: string;
      rating: number;
      title?: string;
      comment?: string;
    }>({
      query: (body) => ({ url: '/api/v1/reviews', method: 'POST', body }),
      invalidatesTags: ['Review'],
    }),

    // GET /api/v1/reviews/restaurant/{restaurantId}/summary
    getRestaurantReviewSummary: builder.query<ApiResponse<any>, string>({
      query: (restaurantId) => `/api/v1/reviews/restaurant/${restaurantId}/summary`,
      providesTags: ['Review'],
    }),

    // GET /api/v1/reviews/menu-item/{menuItemId}
    getMenuItemReviews: builder.query<ApiResponse<any>, string>({
      query: (menuItemId) => `/api/v1/reviews/menu-item/${menuItemId}`,
      providesTags: ['Review'],
    }),

    // GET /api/v1/reviews/menu-item/{menuItemId}/summary
    getMenuItemReviewSummary: builder.query<ApiResponse<any>, string>({
      query: (menuItemId) => `/api/v1/reviews/menu-item/${menuItemId}/summary`,
      providesTags: ['Review'],
    }),

    // PATCH /api/v1/reviews/{reviewId}/hide  — ADMIN hide
    hideReview: builder.mutation<ApiResponse<any>, string>({
      query: (reviewId) => ({
        url: `/api/v1/reviews/${reviewId}/hide`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Review'],
    }),

    // PUT /api/v1/reviews/{reviewId} — Update own review
    updateReview: builder.mutation<ApiResponse<any>, {
      reviewId: string;
      body: {
        reviewType?: 'RESTAURANT' | 'MENU_ITEM';
        orderId?: string;
        restaurantId?: string;
        menuItemId?: string;
        menuItemName?: string;
        rating: number;
        title?: string;
        comment?: string;
      };
    }>({
      query: ({ reviewId, body }) => ({
        url: `/api/v1/reviews/${reviewId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Review'],
    }),

    // DELETE /api/v1/reviews/{id}
    deleteReview: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/api/v1/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useGetTicketQuery,
  useCloseTicketMutation,
  useReplyToTicketMutation,
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
  useAgentReplyMutation,
  useDeleteTicketMutation,
  useGetRestaurantReviewsQuery,
  useGetRestaurantReviewSummaryQuery,
  useGetMenuItemReviewsQuery,
  useGetMenuItemReviewSummaryQuery,
  useGetMyReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useHideReviewMutation,
  useDeleteReviewMutation,
} = supportApi;
