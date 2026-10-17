import { configureStore, TypedStartListening, createListenerMiddleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { baseApi } from './api/baseApi';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import { registerUiListeners } from './slices/uiListenerMiddleware';
import { registerAuthListeners } from './slices/authListenerMiddleware';

export const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(baseApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const startAppListening = listenerMiddleware.startListening as TypedStartListening<
  RootState,
  AppDispatch
>;

export type AppStartListening = typeof startAppListening;

// 4. Initialize your split listener files immediately
registerUiListeners(startAppListening);
registerAuthListeners(startAppListening);
