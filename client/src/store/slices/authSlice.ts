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
  sessionExpiresAt: Number(sessionStorage.getItem('sessionExpiresAt')) || null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: {
      reducer: (state, action: PayloadAction<{ user: User; expiresAt: number }>) => {
        state.user = action.payload.user;
        state.sessionExpiresAt = action.payload.expiresAt;
      },
      prepare: ({ user, expiresAt }: { user: User; expiresAt?: number }) => ({
        payload: {
          user,
          expiresAt: expiresAt ?? Date.now() + SESSION_DURATION_MS
        }
      })
    },

    logout: state => {
      state.user = null;
      state.sessionExpiresAt = null;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
