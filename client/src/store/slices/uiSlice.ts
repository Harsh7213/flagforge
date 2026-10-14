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
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
};

const getInitialProjectId = (): string | null => sessionStorage.getItem('ff-project');

const initialState: UiState = {
  theme: getInitialTheme(),
  activeProjectId: getInitialProjectId(),
  sidebarOpen: true,
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },

    setSystemTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },

    setActiveProject(state, action: PayloadAction<string>) {
      state.activeProjectId = action.payload;
    },

    clearActiveProject(state) {
      state.activeProjectId = null;
    },

    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },

    addToast(state, action: PayloadAction<Toast>) {
      state.toasts.push(action.payload);
    },

    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    }
  }
});

export const {
  toggleTheme,
  setSystemTheme,
  setActiveProject,
  clearActiveProject,
  toggleSidebar,
  addToast,
  removeToast
} = uiSlice.actions;

export default uiSlice.reducer;
