import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the theme state interface
export interface ThemeState {
  mode: 'light' | 'dark';
}

const initialState: ThemeState = {
  mode: 'light',
};

// Create the theme slice
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Toggle between light and dark mode
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    // Set theme explicitly
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.mode = action.payload;
    },
  },
});

// Export actions
export const { toggleTheme, setTheme } = themeSlice.actions;
// Export reducer for store
export const themeReducer = themeSlice.reducer; 