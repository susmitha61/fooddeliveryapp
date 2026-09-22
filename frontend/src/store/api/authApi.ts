import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types';

// Real backend AuthResponse: { accessToken, tokenType, expiresIn, user: UserSummaryResponse }
// UserSummaryResponse: { id, name, email, phone, role, isActive, isLoggedIn, lastLoginAt, createdAt }
export interface BackendAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    isLoggedIn: boolean;
    lastLoginAt?: string;
    createdAt?: string;
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/v1/auth/register — Public
    // RegisterRequest: { name, email, phone, password, role? }
    // NOTE: backend field is "name" NOT "fullName"
    register: builder.mutation<ApiResponse<BackendAuthResponse>, {
      name: string; email: string; phone: string; password: string; role?: string;
    }>({
      query: (body) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body: {
          name: body.name,        // backend RegisterRequest.name
          email: body.email,
          password: body.password,
          phone: body.phone,
          role: body.role || 'CUSTOMER',
        },
      }),
    }),

    // POST /api/v1/auth/login — Public
    // LoginRequest: { email, password }
    login: builder.mutation<ApiResponse<BackendAuthResponse>, { email: string; password: string }>({
      query: (body) => ({ url: '/api/v1/auth/login', method: 'POST', body }),
    }),

    // POST /api/v1/auth/logout — Authenticated
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({ url: '/api/v1/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth', 'Cart'],
    }),

    // GET /api/v1/auth/profile — Authenticated
    getProfile: builder.query<ApiResponse<BackendAuthResponse['user']>, void>({
      query: () => '/api/v1/auth/profile',
      providesTags: ['Auth'],
    }),

    // PUT /api/v1/auth/profile — Authenticated
    // UserProfileRequest: { name, phone }  (backend auth-service uses "name")
    updateAuthProfile: builder.mutation<ApiResponse<BackendAuthResponse['user']>, { name: string; phone: string }>({
      query: (body) => ({ url: '/api/v1/auth/profile', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),

    // POST /api/v1/auth/change-password — Authenticated
    // ChangePasswordRequest: { currentPassword, newPassword }
    changePassword: builder.mutation<ApiResponse<void>, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/api/v1/auth/change-password', method: 'POST', body }),
    }),

    // GET /api/v1/auth/manager/users — MANAGER / ADMIN (paginated)
    listUsers: builder.query<ApiResponse<any>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 20 } = {}) =>
        `/api/v1/auth/manager/users?page=${page}&size=${size}`,
      providesTags: ['User'],
    }),

    // PUT /api/v1/auth/admin/users/{id}/role?role=X — ADMIN
    changeRole: builder.mutation<ApiResponse<any>, { id: string; role: string }>({
      query: ({ id, role }) => ({
        url: `/api/v1/auth/admin/users/${id}/role`,
        method: 'PUT',
        params: { role },
      }),
      invalidatesTags: ['User'],
    }),

    // PATCH /api/v1/admin/users/{id}/toggle-active — ADMIN
    toggleActive: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({
        url: `/api/v1/admin/users/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['User', 'Session'],
    }),

    // GET /api/v1/admin/sessions — ADMIN
    activeSessions: builder.query<ApiResponse<any[]>, void>({
      query: () => '/api/v1/admin/sessions',
      providesTags: ['Session'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateAuthProfileMutation,
  useChangePasswordMutation,
  useListUsersQuery,
  useChangeRoleMutation,
  useToggleActiveMutation,
  useActiveSessionsQuery,
} = authApi;
