import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const SESSION_DURATION_MS = 60 * 60 * 1000;

export interface User {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthState {
  user: User | null;
  sessionExpiresAt: number | null;
}

const initialState: AuthState = {
  user: null,
  sessionExpiresAt: Number(sessionStorage.getItem('sessionExpiresAt')) || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; expiresAt?: number }>
    ) => {
      const expiresAt = action.payload.expiresAt ?? Date.now() + SESSION_DURATION_MS;
      state.user = action.payload.user;
      state.sessionExpiresAt = expiresAt;
      sessionStorage.setItem('sessionExpiresAt', String(expiresAt));
    },
    logout: (state) => {
      state.user = null;
      state.sessionExpiresAt = null;
      sessionStorage.removeItem('sessionExpiresAt');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
