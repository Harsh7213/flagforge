import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setCredentials, logout } from './authSlice';

export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action) => {
    sessionStorage.setItem(
      'sessionExpiresAt',
      String(action.payload.expiresAt)
    );
  }
});

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    sessionStorage.removeItem('sessionExpiresAt');
  }
});