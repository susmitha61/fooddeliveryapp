import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState } from '@/types';

const initialState: ThemeState = { theme: 'dark' };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'dark' | 'warm'>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'warm' : 'dark';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
