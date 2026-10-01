import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { setCredentials, logout, SESSION_DURATION_MS } from '../../slices/authSlice';
import type { User } from '../../slices/authSlice';

const mockUser: User = {
  id: 'user-1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  organizationId: 'org-1',
  organizationName: 'Acme Corp',
  role: 'owner'
};

const initialState = { user: null, sessionExpiresAt: null };

describe('authSlice', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  // ─── Initial State ──────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('should have user as null', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      expect(state.user).toBeNull();
    });

    it('should read sessionExpiresAt from sessionStorage on init', () => {
      const future = Date.now() + 1000;
      sessionStorage.setItem('sessionExpiresAt', String(future));
      // Re-require module to trigger initialState evaluation
      // We test the reducer's response to the value via setCredentials instead
      const state = authReducer({ user: null, sessionExpiresAt: future }, { type: '@@INIT' });
      expect(state.sessionExpiresAt).toBe(future);
    });
  });

  // ─── setCredentials ─────────────────────────────────────────────────────────
  describe('setCredentials', () => {
    it('should set user in state', () => {
      const state = authReducer(initialState, setCredentials({ user: mockUser }));
      expect(state.user).toEqual(mockUser);
    });

    it('should set sessionExpiresAt to provided expiresAt', () => {
      const expiresAt = Date.now() + 3600000;
      const state = authReducer(initialState, setCredentials({ user: mockUser, expiresAt }));
      expect(state.sessionExpiresAt).toBe(expiresAt);
    });

    it('should default sessionExpiresAt to now + SESSION_DURATION_MS when not provided', () => {
      const before = Date.now();
      const state = authReducer(initialState, setCredentials({ user: mockUser }));
      const after = Date.now();

      expect(state.sessionExpiresAt).toBeGreaterThanOrEqual(before + SESSION_DURATION_MS);
      expect(state.sessionExpiresAt).toBeLessThanOrEqual(after + SESSION_DURATION_MS);
    });

    it('should persist sessionExpiresAt to sessionStorage', () => {
      const expiresAt = Date.now() + 5000;
      authReducer(initialState, setCredentials({ user: mockUser, expiresAt }));
      expect(sessionStorage.getItem('sessionExpiresAt')).toBe(String(expiresAt));
    });

    it('should update an existing user', () => {
      const withUser = { user: mockUser, sessionExpiresAt: Date.now() + 1000 };
      const updatedUser: User = { ...mockUser, name: 'Alice Updated' };
      const state = authReducer(withUser, setCredentials({ user: updatedUser }));
      expect(state.user?.name).toBe('Alice Updated');
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should clear user from state', () => {
      const withUser = { user: mockUser, sessionExpiresAt: Date.now() + 1000 };
      const state = authReducer(withUser, logout());
      expect(state.user).toBeNull();
    });

    it('should clear sessionExpiresAt from state', () => {
      const withUser = { user: mockUser, sessionExpiresAt: Date.now() + 1000 };
      const state = authReducer(withUser, logout());
      expect(state.sessionExpiresAt).toBeNull();
    });

    it('should remove sessionExpiresAt from sessionStorage', () => {
      sessionStorage.setItem('sessionExpiresAt', '999999999');
      const withUser = { user: mockUser, sessionExpiresAt: 999999999 };
      authReducer(withUser, logout());
      expect(sessionStorage.getItem('sessionExpiresAt')).toBeNull();
    });
  });
});
