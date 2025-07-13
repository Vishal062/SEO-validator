import { configureStore } from '@reduxjs/toolkit';
import { seoReducer, SeoState } from './seoSlice';

// Create the Redux store and add the SEO slice reducer
export const store = configureStore({
  reducer: {
    seo: seoReducer,
  },
});

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 