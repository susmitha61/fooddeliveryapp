import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthUser } from '@/types';
import { saveToken, saveUser, clearToken, loadToken, loadUser } from '@/lib/utils';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
      saveToken(token);
      saveUser(user);
    },

    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveUser(state.user);
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      clearToken();
    },

    hydrate: (state) => {
      const token = loadToken();
      const user = loadUser();
      if (token && user) {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
      } else {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      }
      state.isLoading = false;
    },
  },
});

export const { setCredentials, updateUser, logout, hydrate } = authSlice.actions;
export default authSlice.reducer;
