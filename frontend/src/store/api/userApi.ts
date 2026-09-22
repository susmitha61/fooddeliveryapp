import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types';

export const userApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ─── User Profile ──────────────────────────────────────────────────────────
    // GET /api/v1/users/{userId}
    getUserProfile: builder.query<ApiResponse<any>, string>({
      query: (userId) => `/api/v1/users/${userId}`,
      providesTags: ['User'],
    }),

    // PUT /api/v1/users/{userId}
    // UserProfileRequest: { name, email, phone, profilePictureUrl, bio }
    updateUserProfile: builder.mutation<ApiResponse<any>, { userId: string; body: {
      name?: string; email?: string; phone?: string;
      profilePictureUrl?: string; bio?: string;
    }}>({
      query: ({ userId, body }) => ({
        url: `/api/v1/users/${userId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // ─── Addresses ────────────────────────────────────────────────────────────
    // GET /api/v1/addresses/users/{userId}
    getAddresses: builder.query<ApiResponse<any[]>, string>({
      query: (userId) => `/api/v1/addresses/users/${userId}`,
      providesTags: ['Address'],
    }),

    // POST /api/v1/addresses/users/{userId}
    // AddressRequest: { label, streetAddress, city, state, pincode, landmark?, latitude?, longitude?, isDefault? }
    addAddress: builder.mutation<ApiResponse<any>, { userId: string; body: {
      label: string; streetAddress: string; city: string; state: string;
      pincode: string; landmark?: string; latitude?: number; longitude?: number; isDefault?: boolean;
    }}>({
      query: ({ userId, body }) => ({
        url: `/api/v1/addresses/users/${userId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Address'],
    }),

    // PUT /api/v1/addresses/users/{userId}/{addressId}
    updateAddress: builder.mutation<ApiResponse<any>, { userId: string; addressId: string; body: {
      label: string; streetAddress: string; city: string; state: string;
      pincode: string; landmark?: string; isDefault?: boolean;
    }}>({
      query: ({ userId, addressId, body }) => ({
        url: `/api/v1/addresses/users/${userId}/${addressId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Address'],
    }),

    // DELETE /api/v1/addresses/users/{userId}/{addressId}
    deleteAddress: builder.mutation<ApiResponse<void>, { userId: string; addressId: string }>({
      query: ({ userId, addressId }) => ({
        url: `/api/v1/addresses/users/${userId}/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
    }),

    // PATCH /api/v1/addresses/users/{userId}/{addressId}/set-default
    setDefaultAddress: builder.mutation<ApiResponse<any>, { userId: string; addressId: string }>({
      query: ({ userId, addressId }) => ({
        url: `/api/v1/addresses/users/${userId}/${addressId}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Address'],
    }),

    // ─── Favourites ───────────────────────────────────────────────────────────
    // GET /api/v1/favourites/users/{userId}
    getFavourites: builder.query<ApiResponse<any[]>, string>({
      query: (userId) => `/api/v1/favourites/users/${userId}`,
      providesTags: ['Favourite'],
    }),

    // POST /api/v1/favourites/users/{userId}
    // FavouriteRequest: { restaurantId, restaurantName, restaurantCuisine? }
    addFavourite: builder.mutation<ApiResponse<any>, { userId: string; restaurantId: string; restaurantName: string; restaurantCuisine?: string }>({
      query: ({ userId, ...body }) => ({
        url: `/api/v1/favourites/users/${userId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Favourite'],
    }),

    // DELETE /api/v1/favourites/users/{userId}/restaurants/{restaurantId}
    removeFavourite: builder.mutation<ApiResponse<void>, { userId: string; restaurantId: string }>({
      query: ({ userId, restaurantId }) => ({
        url: `/api/v1/favourites/users/${userId}/restaurants/${restaurantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favourite'],
    }),

    // GET /api/v1/favourites/users/{userId}/restaurants/{restaurantId}/check
    checkFavourite: builder.query<ApiResponse<boolean>, { userId: string; restaurantId: string }>({
      query: ({ userId, restaurantId }) =>
        `/api/v1/favourites/users/${userId}/restaurants/${restaurantId}/check`,
      providesTags: ['Favourite'],
    }),

    // GET /api/v1/manager/users — ADMIN and MANAGER list users
    getAllUsers: builder.query<ApiResponse<any>, { page?: number; size?: number } | void>({
      query: () => '/api/v1/manager/users',
      providesTags: ['User'],
    }),

    // PATCH /api/v1/admin/users/{userId}/role?role=X  — ADMIN only
    updateUserRole: builder.mutation<ApiResponse<any>, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/api/v1/admin/users/${userId}/role`,
        method: 'PATCH',
        params: { role },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetFavouritesQuery,
  useAddFavouriteMutation,
  useRemoveFavouriteMutation,
  useCheckFavouriteQuery,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
} = userApi;

// Legacy alias
export const useToggleFavoriteMutation = useAddFavouriteMutation;
