import { configureStore } from '@reduxjs/toolkit';
import { seoReducer, SeoState } from './seoSlice';
import { themeReducer, ThemeState } from './themeSlice';

// Create the Redux store and add the SEO and theme slice reducers
export const store = configureStore({
  reducer: {
    seo: seoReducer,
    theme: themeReducer,
  },
});

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 