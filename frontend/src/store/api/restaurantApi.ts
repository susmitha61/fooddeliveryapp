import { baseApi } from './baseApi';
import type { ApiResponse, PageResponse, Restaurant, MenuResponse, MenuItem, MenuCategory } from '@/types';

export const restaurantApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ── PUBLIC RESTAURANT QUERIES ──────────────────────────
    getRestaurants: builder.query<ApiResponse<PageResponse<Restaurant>>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) => `/api/v1/restaurants?page=${page}&size=${size}`,
      providesTags: ['Restaurant'],
    }),

    filterRestaurants: builder.query<ApiResponse<PageResponse<Restaurant>>, Record<string, any>>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
              queryParams.append(key, String(val));
            }
          });
        }
        const qs = queryParams.toString();
        return `/api/v1/restaurants/filter${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Restaurant'],
    }),

    getOpenNow: builder.query<ApiResponse<any>, void>({
      query: () => '/api/v1/restaurants/open-now',
      providesTags: ['Restaurant'],
    }),

    getTopRated: builder.query<ApiResponse<Restaurant[]>, { minRating?: number }>({
      query: ({ minRating = 4.0 } = {}) => `/api/v1/restaurants/top-rated?minRating=${minRating}`,
      providesTags: ['Restaurant'],
    }),

    getRestaurantById: builder.query<ApiResponse<Restaurant>, string>({
      query: (id) => `/api/v1/restaurants/${id}`,
      providesTags: (_, __, id) => [{ type: 'Restaurant', id }],
    }),

    // ── OWNER RESTAURANT QUERIES ───────────────────────────
    // GET /api/v1/restaurants/my-restaurants — RESTAURANT_OWNER (X-User-Id header)
    getMyRestaurants: builder.query<ApiResponse<Restaurant[]>, void>({
      query: () => '/api/v1/restaurants/my-restaurants',
      providesTags: ['Restaurant'],
    }),

    // POST /api/v1/restaurants — RESTAURANT_OWNER
    // RestaurantRequest: { name, description, cuisineType, mealTypes, streetAddress, area, city, state, pincode, phone, email, openingTime, closingTime, deliveryFee, minimumOrderAmount, isPureVeg, imageUrl }
    createRestaurant: builder.mutation<ApiResponse<Restaurant>, {
      name: string; description?: string; cuisineType: string;
      mealTypes?: string[]; streetAddress: string; area: string;
      city: string; state: string; pincode: string;
      phone: string; email?: string;
      openingTime?: string; closingTime?: string;
      deliveryFee?: number; minimumOrderAmount?: number;
      isPureVeg?: boolean; imageUrl?: string;
    }>({
      query: (body) => ({ url: '/api/v1/restaurants', method: 'POST', body }),
      invalidatesTags: ['Restaurant'],
    }),

    // PUT /api/v1/restaurants/{id} — RESTAURANT_OWNER
    updateRestaurant: builder.mutation<ApiResponse<Restaurant>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/api/v1/restaurants/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Restaurant'],
    }),

    // PATCH /api/v1/restaurants/{id}/toggle-open — RESTAURANT_OWNER
    toggleOpen: builder.mutation<ApiResponse<Restaurant>, string>({
      query: (id) => ({ url: `/api/v1/restaurants/${id}/toggle-open`, method: 'PATCH' }),
      invalidatesTags: ['Restaurant'],
    }),

    // PATCH /api/v1/restaurants/{id}/status?status=X — ADMIN
    changeRestaurantStatus: builder.mutation<ApiResponse<Restaurant>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/v1/restaurants/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: ['Restaurant'],
    }),

    // DELETE /api/v1/restaurants/{id} — ADMIN
    deleteRestaurant: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/api/v1/restaurants/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Restaurant'],
    }),

    // PATCH /api/v1/restaurants/{id}/assign-manager?managerId=X — OWNER/ADMIN
    assignManager: builder.mutation<ApiResponse<Restaurant>, { restaurantId: string; managerId: string }>({
      query: ({ restaurantId, managerId }) => ({
        url: `/api/v1/restaurants/${restaurantId}/assign-manager?managerId=${managerId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Restaurant'],
    }),

    // PATCH /api/v1/restaurants/{id}/unassign-manager?managerId=X — OWNER/ADMIN
    unassignManager: builder.mutation<ApiResponse<Restaurant>, { restaurantId: string; managerId: string }>({
      query: ({ restaurantId, managerId }) => ({
        url: `/api/v1/restaurants/${restaurantId}/unassign-manager?managerId=${managerId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Restaurant'],
    }),

    // ── MENU QUERIES ───────────────────────────────────────
    // GET /api/v1/menus/{restaurantId} — Public
    // MenuResponse: { restaurantId, restaurantName, isPureVeg, categories: [{ id, name, items: [...] }], bestSellers, todaysSpecials }
    getFullMenu: builder.query<ApiResponse<MenuResponse>, string>({
      query: (restaurantId) => `/api/v1/menus/${restaurantId}`,
      providesTags: ['Menu'],
    }),

    // GET /api/v1/menus/{restaurantId}/categories — Public
    getMenuCategories: builder.query<ApiResponse<MenuCategory[]>, string>({
      query: (restaurantId) => `/api/v1/menus/${restaurantId}/categories`,
      providesTags: ['Menu'],
    }),

    // GET /api/v1/menus/{restaurantId}/filter — Public
    filterMenuItems: builder.query<ApiResponse<MenuItem[]>, { restaurantId: string; params?: Record<string, any> }>({
      query: ({ restaurantId, params }) => ({ url: `/api/v1/menus/${restaurantId}/filter`, params }),
      providesTags: ['Menu'],
    }),

    // GET /api/v1/menus/{restaurantId}/best-sellers — Public
    getBestSellers: builder.query<ApiResponse<MenuItem[]>, { restaurantId: string; limit?: number }>({
      query: ({ restaurantId, limit = 5 }) => `/api/v1/menus/${restaurantId}/best-sellers?limit=${limit}`,
      providesTags: ['Menu'],
    }),

    // ── OWNER MENU MUTATIONS ───────────────────────────────
    // POST /api/v1/menus/{restaurantId}/categories — RESTAURANT_OWNER
    // MenuCategoryRequest: { name, description?, displayOrder? }
    createCategory: builder.mutation<ApiResponse<MenuCategory>, { restaurantId: string; name: string; description?: string; displayOrder?: number }>({
      query: ({ restaurantId, ...body }) => ({
        url: `/api/v1/menus/${restaurantId}/categories`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Menu'],
    }),

    // DELETE /api/v1/menus/{restaurantId}/categories/{catId} — RESTAURANT_OWNER (no PUT in backend spec)
    deleteCategory: builder.mutation<ApiResponse<void>, { restaurantId: string; catId: string }>({
      query: ({ restaurantId, catId }) => ({
        url: `/api/v1/menus/${restaurantId}/categories/${catId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu'],
    }),

    // POST /api/v1/menus/{restaurantId}/items — RESTAURANT_OWNER
    // MenuItemRequest: { name, description, price, imageUrl, isVegetarian, isVegan, isSpicy, mealType, isAvailable, isTodaysSpecial, isBestSeller, preparationTimeMinutes, allergenInfo, calories, categoryId }
    createMenuItem: builder.mutation<ApiResponse<MenuItem>, { restaurantId: string; body: {
      name: string; description?: string; price: number; imageUrl?: string;
      isVegetarian?: boolean; isVegan?: boolean; isSpicy?: boolean;
      mealType?: string; isAvailable?: boolean; isTodaysSpecial?: boolean;
      isBestSeller?: boolean; preparationTimeMinutes?: number;
      allergenInfo?: string; calories?: number; categoryId?: string;
    }}>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/menus/${restaurantId}/items`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Menu'],
    }),

    // PUT /api/v1/menus/items/{itemId} — RESTAURANT_OWNER (no restaurantId in path!)
    updateMenuItem: builder.mutation<ApiResponse<MenuItem>, { itemId: string; body: Partial<MenuItem> }>({
      query: ({ itemId, body }) => ({
        url: `/api/v1/menus/items/${itemId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Menu'],
    }),

    // DELETE /api/v1/menus/items/{itemId} — RESTAURANT_OWNER
    deleteMenuItem: builder.mutation<ApiResponse<void>, string>({
      query: (itemId) => ({
        url: `/api/v1/menus/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu'],
    }),

    // PATCH /api/v1/menus/items/{itemId}/toggle-availability — RESTAURANT_OWNER
    toggleMenuItemAvailable: builder.mutation<ApiResponse<MenuItem>, string>({
      query: (itemId) => ({
        url: `/api/v1/menus/items/${itemId}/toggle-availability`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Menu'],
    }),

    // PATCH /api/v1/menus/items/{itemId}/toggle-special — RESTAURANT_OWNER
    toggleMenuItemSpecial: builder.mutation<ApiResponse<MenuItem>, string>({
      query: (itemId) => ({
        url: `/api/v1/menus/items/${itemId}/toggle-special`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Menu'],
    }),

    // ── REVIEWS ───────────────────────────────────────────
    addReview: builder.mutation<ApiResponse<any>, {
      reviewType?: 'RESTAURANT' | 'MENU_ITEM';
      restaurantId: string;
      orderId?: string;
      menuItemId?: string;
      menuItemName?: string;
      rating: number;
      comment?: string;
      title?: string;
    }>({
      query: (body) => ({
        url: '/api/v1/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Restaurant', 'Order', 'Review'],
    }),
  }),
});

export const {
  useGetRestaurantsQuery,
  useFilterRestaurantsQuery,
  useGetOpenNowQuery,
  useGetTopRatedQuery,
  useGetRestaurantByIdQuery,
  useGetMyRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useToggleOpenMutation,
  useChangeRestaurantStatusMutation,
  useDeleteRestaurantMutation,
  useAssignManagerMutation,
  useUnassignManagerMutation,
  useGetFullMenuQuery,
  useGetMenuCategoriesQuery,
  useFilterMenuItemsQuery,
  useGetBestSellersQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailableMutation,
  useToggleMenuItemSpecialMutation,
  useAddReviewMutation,
} = restaurantApi;

// Alias
export const useGetRestaurantMenuQuery = useGetFullMenuQuery;
