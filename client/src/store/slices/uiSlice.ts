import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'dark' | 'light';

interface UiState {
  theme: Theme;
  activeProjectId: string | null;
  sidebarOpen: boolean;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('ff-theme') as Theme;
  if (saved && (saved === 'dark' || saved === 'light')) {
    return saved;
  }
  // Auto-detect device system preference
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const getInitialProjectId = (): string | null => localStorage.getItem('ff-project');

const initialState: UiState = {
  theme: getInitialTheme(),
  activeProjectId: getInitialProjectId(),
  sidebarOpen: true,
  toasts: [],
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
};

// Apply theme immediately on script load
applyTheme(initialState.theme);

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ff-theme', state.theme);
      applyTheme(state.theme);
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      localStorage.setItem('ff-theme', state.theme);
      applyTheme(state.theme);
    },
    setSystemTheme(state, action: PayloadAction<Theme>) {
      if (!localStorage.getItem('ff-theme')) {
        state.theme = action.payload;
        applyTheme(state.theme);
      }
    },
    setActiveProject(state, action: PayloadAction<string>) {
      state.activeProjectId = action.payload;
      localStorage.setItem('ff-project', action.payload);
    },
    clearActiveProject(state) {
      state.activeProjectId = null;
      localStorage.removeItem('ff-project');
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleTheme, setTheme, setSystemTheme, setActiveProject, clearActiveProject, toggleSidebar, addToast, removeToast } =
  uiSlice.actions;

export default uiSlice.reducer;
