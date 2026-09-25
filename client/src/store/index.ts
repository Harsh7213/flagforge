import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { flagsApi } from './api/flagsApi';
import { projectsApi } from './api/projectsApi';
import { authApi } from './api/authApi';
import { organizationApi } from './api/organizationApi';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    [flagsApi.reducerPath]: flagsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      flagsApi.middleware,
      projectsApi.middleware,
      authApi.middleware,
      organizationApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
