import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { extractToken, loadUser } from '@/lib/utils';
import { logout } from '../slices/authSlice';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state.auth?.token || extractToken();
    const user = state.auth?.user || loadUser();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const userId = user?.id || user?.userId;
    if (userId) {
      headers.set('X-User-Id', userId);
    }
    if (user?.role) {
      headers.set('X-User-Role', user.role);
    }
    if (user?.email) {
      headers.set('X-User-Email', user.email);
    }
    return headers;
  },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Session expired or invalid token
    api.dispatch(logout());
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth/login?reason=session_expired';
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Session', 'User', 'Address', 'Favourite', 'Restaurant', 'Menu', 'Cart', 'Order', 'Payment', 'Support', 'Review'],
  endpoints: () => ({}),
});
