import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the initial state for SEO results
export interface SeoState {
  results: unknown[];
}

const initialState: SeoState = {
  results: [],
};

// Create the SEO slice
const seoSlice = createSlice({
  name: 'seo',
  initialState,
  reducers: {
    // Set the SEO results (replace all)
    setResults(state, action: PayloadAction<unknown[]>) {
      state.results = action.payload;
    },
    // Clear all SEO results
    clearResults(state) {
      state.results = [];
    },
  },
});

// Export actions
export const { setResults, clearResults } = seoSlice.actions;
// Export reducer for store
export const seoReducer = seoSlice.reducer; 