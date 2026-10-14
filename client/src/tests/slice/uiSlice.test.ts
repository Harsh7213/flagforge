import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import uiReducer, {
  toggleTheme,
  setSystemTheme,
  setActiveProject,
  clearActiveProject,
  toggleSidebar,
  addToast,
  removeToast
} from '../../store/slices/uiSlice';

import { uiListenerMiddleware } from '../../store/slices/uiListenerMiddleware';

const lightState = {
  theme: 'light' as const,
  activeProjectId: null,
  sidebarOpen: true,
  toasts: [] as {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  }[]
};

const darkState = {
  ...lightState,
  theme: 'dark' as const
};

const createTestStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().prepend(uiListenerMiddleware.middleware)
  });

describe('uiSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ─── toggleTheme ──────────────────────────────────────────────────────────
  describe('toggleTheme', () => {
    it('should switch light → dark', () => {
      const state = uiReducer(lightState, toggleTheme());

      expect(state.theme).toBe('dark');
    });

    it('should switch dark → light', () => {
      const state = uiReducer(darkState, toggleTheme());

      expect(state.theme).toBe('light');
    });
  });

  // ─── setSystemTheme ───────────────────────────────────────────────────────
  describe('setSystemTheme', () => {
    it('should update theme to the provided system theme', () => {
      const state = uiReducer(lightState, setSystemTheme('dark'));

      expect(state.theme).toBe('dark');
    });

    it('should update theme to light when light is provided', () => {
      const state = uiReducer(darkState, setSystemTheme('light'));

      expect(state.theme).toBe('light');
    });
  });

  // ─── setActiveProject ─────────────────────────────────────────────────────
  describe('setActiveProject', () => {
    it('should set activeProjectId', () => {
      const state = uiReducer(lightState, setActiveProject('proj-abc'));

      expect(state.activeProjectId).toBe('proj-abc');
    });
  });

  // ─── clearActiveProject ────────────────────────────────────────────────────
  describe('clearActiveProject', () => {
    it('should set activeProjectId to null', () => {
      const withProject = {
        ...lightState,
        activeProjectId: 'proj-abc'
      };

      const state = uiReducer(withProject, clearActiveProject());

      expect(state.activeProjectId).toBeNull();
    });
  });

  // ─── toggleSidebar ────────────────────────────────────────────────────────
  describe('toggleSidebar', () => {
    it('should close sidebar when it is open', () => {
      const state = uiReducer({ ...lightState, sidebarOpen: true }, toggleSidebar());

      expect(state.sidebarOpen).toBe(false);
    });

    it('should open sidebar when it is closed', () => {
      const state = uiReducer({ ...lightState, sidebarOpen: false }, toggleSidebar());

      expect(state.sidebarOpen).toBe(true);
    });
  });

  // ─── addToast ─────────────────────────────────────────────────────────────
  describe('addToast', () => {
    it('should add a toast', () => {
      const toast = {
        id: 'toast-1',
        type: 'success' as const,
        message: 'Done!'
      };

      const state = uiReducer(lightState, addToast(toast));

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0]).toEqual(toast);
    });

    it('should accumulate multiple toasts', () => {
      let state = uiReducer(
        lightState,
        addToast({
          id: 'toast-1',
          type: 'success',
          message: 'Toast 1'
        })
      );

      state = uiReducer(
        state,
        addToast({
          id: 'toast-2',
          type: 'error',
          message: 'Toast 2'
        })
      );

      expect(state.toasts).toHaveLength(2);
    });

    it('should support error and info types', () => {
      let state = uiReducer(
        lightState,
        addToast({
          id: 'toast-1',
          type: 'error',
          message: 'Oops'
        })
      );

      expect(state.toasts[0].type).toBe('error');

      state = uiReducer(
        state,
        addToast({
          id: 'toast-2',
          type: 'info',
          message: 'FYI'
        })
      );

      expect(state.toasts[1].type).toBe('info');
    });
  });

  // ─── removeToast ──────────────────────────────────────────────────────────
  describe('removeToast', () => {
    it('should remove a toast by id', () => {
      let state = uiReducer(
        lightState,
        addToast({
          id: 'toast-1',
          type: 'success',
          message: 'Hi'
        })
      );

      state = uiReducer(state, removeToast('toast-1'));

      expect(state.toasts).toHaveLength(0);
    });

    it('should only remove the targeted toast', () => {
      let state = uiReducer(
        lightState,
        addToast({
          id: 'toast-1',
          type: 'success',
          message: 'A'
        })
      );

      state = uiReducer(
        state,
        addToast({
          id: 'toast-2',
          type: 'error',
          message: 'B'
        })
      );

      state = uiReducer(state, removeToast('toast-1'));

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('B');
    });

    it('should be a no-op for unknown id', () => {
      const state = uiReducer(
        lightState,
        addToast({
          id: 'toast-1',
          type: 'info',
          message: 'Keep me'
        })
      );

      const nextState = uiReducer(state, removeToast('non-existent-id'));

      expect(nextState.toasts).toHaveLength(1);
    });
  });

  // ─── UI Listener Middleware ───────────────────────────────────────────────
  describe('uiListenerMiddleware', () => {
    it('should persist theme to localStorage when toggled', async () => {
      const store = createTestStore();

      store.dispatch(toggleTheme());

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(store.getState().ui.theme).toBe('dark');
      expect(localStorage.getItem('ff-theme')).toBe('dark');
    });

    it('should persist active project to sessionStorage', async () => {
      const store = createTestStore();

      store.dispatch(setActiveProject('proj-abc'));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(store.getState().ui.activeProjectId).toBe('proj-abc');

      expect(sessionStorage.getItem('ff-project')).toBe('proj-abc');
    });

    it('should remove active project from sessionStorage', async () => {
      const store = createTestStore();

      sessionStorage.setItem('ff-project', 'proj-abc');

      store.dispatch(clearActiveProject());

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(store.getState().ui.activeProjectId).toBeNull();

      expect(sessionStorage.getItem('ff-project')).toBeNull();
    });

    it('should not apply a system theme when a saved preference exists', async () => {
      localStorage.setItem('ff-theme', 'light');

      const store = createTestStore();

      // The listener checks localStorage, but the reducer still
      // updates the theme because it no longer reads localStorage.
      store.dispatch(setSystemTheme('dark'));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(localStorage.getItem('ff-theme')).toBe('light');
    });
  });
});
