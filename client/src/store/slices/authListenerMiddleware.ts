import { startAppListening } from '../store';
import { setCredentials, logout } from './authSlice';

export const registerAuthListeners = (startListening: typeof startAppListening) => {
  startListening({
    actionCreator: setCredentials,
    effect: action => {
      sessionStorage.setItem('sessionExpiresAt', String(action.payload.expiresAt));
    }
  });

  startListening({
    actionCreator: logout,
    effect: () => {
      sessionStorage.removeItem('sessionExpiresAt');
    }
  });
};
