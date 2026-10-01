import { describe, it, expect, beforeEach, vi } from 'vitest';
import uiReducer, {
  toggleTheme,
  setSystemTheme,
  setActiveProject,
  clearActiveProject,
  toggleSidebar,
  addToast,
  removeToast
} from '../../slices/uiSlice';

// applyTheme touches document.documentElement — jsdom supports it, but we spy to prevent side-effects noise
const setAttributeSpy = vi
  .spyOn(document.documentElement, 'setAttribute')
  .mockImplementation(() => {});

const lightState = {
  theme: 'light' as const,
  activeProjectId: null,
  sidebarOpen: true,
  toasts: []
};

const darkState = { ...lightState, theme: 'dark' as const };

describe('uiSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setAttributeSpy.mockClear();
  });

  // ─── toggleTheme ───────────────────────────────────────────────────────────
  describe('toggleTheme', () => {
    it('should switch light → dark', () => {
      const state = uiReducer(lightState, toggleTheme());
      expect(state.theme).toBe('dark');
    });

    it('should switch dark → light', () => {
      const state = uiReducer(darkState, toggleTheme());
      expect(state.theme).toBe('light');
    });

    it('should persist theme to localStorage', () => {
      uiReducer(lightState, toggleTheme());
      expect(localStorage.getItem('ff-theme')).toBe('dark');
    });
  });

  // ─── setSystemTheme ────────────────────────────────────────────────────────
  describe('setSystemTheme', () => {
    it('should apply system theme when no ff-theme is stored', () => {
      const state = uiReducer(lightState, setSystemTheme('dark'));
      expect(state.theme).toBe('dark');
    });

    it('should NOT override user preference when ff-theme is already stored', () => {
      localStorage.setItem('ff-theme', 'light');
      const state = uiReducer(darkState, setSystemTheme('dark'));
      // theme stays as-is because user already set it
      expect(state.theme).toBe('dark'); // unchanged from darkState
    });
  });

  // ─── setActiveProject ──────────────────────────────────────────────────────
  describe('setActiveProject', () => {
    it('should set activeProjectId', () => {
      const state = uiReducer(lightState, setActiveProject('proj-abc'));
      expect(state.activeProjectId).toBe('proj-abc');
    });

    it('should persist to sessionStorage', () => {
      uiReducer(lightState, setActiveProject('proj-abc'));
      expect(sessionStorage.getItem('ff-project')).toBe('proj-abc');
    });
  });

  // ─── clearActiveProject ────────────────────────────────────────────────────
  describe('clearActiveProject', () => {
    it('should set activeProjectId to null', () => {
      const withProject = { ...lightState, activeProjectId: 'proj-abc' };
      const state = uiReducer(withProject, clearActiveProject());
      expect(state.activeProjectId).toBeNull();
    });

    it('should remove ff-project from sessionStorage', () => {
      sessionStorage.setItem('ff-project', 'proj-abc');
      uiReducer({ ...lightState, activeProjectId: 'proj-abc' }, clearActiveProject());
      expect(sessionStorage.getItem('ff-project')).toBeNull();
    });
  });

  // ─── toggleSidebar ─────────────────────────────────────────────────────────
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

  // ─── addToast ──────────────────────────────────────────────────────────────
  describe('addToast', () => {
    it('should add a toast with generated id', () => {
      const state = uiReducer(lightState, addToast({ type: 'success', message: 'Done!' }));
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('Done!');
      expect(state.toasts[0].type).toBe('success');
      expect(state.toasts[0].id).toBeDefined();
    });

    it('should accumulate multiple toasts', () => {
      let state = uiReducer(lightState, addToast({ type: 'success', message: 'Toast 1' }));
      state = uiReducer(state, addToast({ type: 'error', message: 'Toast 2' }));
      expect(state.toasts).toHaveLength(2);
    });

    it('should support error and info types', () => {
      let state = uiReducer(lightState, addToast({ type: 'error', message: 'Oops' }));
      expect(state.toasts[0].type).toBe('error');
      state = uiReducer(lightState, addToast({ type: 'info', message: 'FYI' }));
      expect(state.toasts[0].type).toBe('info');
    });
  });

  // ─── removeToast ──────────────────────────────────────────────────────────
  describe('removeToast', () => {
    it('should remove a toast by id', () => {
      let state = uiReducer(lightState, addToast({ type: 'success', message: 'Hi' }));
      const id = state.toasts[0].id;
      state = uiReducer(state, removeToast(id));
      expect(state.toasts).toHaveLength(0);
    });

    it('should only remove the targeted toast', () => {
      let state = uiReducer(lightState, addToast({ type: 'success', message: 'A' }));
      // Advance time so second toast gets a different Date.now() id
      vi.useFakeTimers();
      vi.advanceTimersByTime(1);
      state = uiReducer(state, addToast({ type: 'error', message: 'B' }));
      vi.useRealTimers();

      const [toastA] = state.toasts;
      state = uiReducer(state, removeToast(toastA.id));
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('B');
    });

    it('should be a no-op for unknown id', () => {
      let state = uiReducer(lightState, addToast({ type: 'info', message: 'Keep me' }));
      state = uiReducer(state, removeToast('non-existent-id'));
      expect(state.toasts).toHaveLength(1);
    });
  });
});
