import { createListenerMiddleware } from '@reduxjs/toolkit';

import {
  toggleTheme,
  setSystemTheme,
  setActiveProject,
  clearActiveProject
} from './uiSlice';

import { applyTheme } from '../../utils/applyTheme';

export const uiListenerMiddleware = createListenerMiddleware();

// Toggle theme: persist preference and apply theme
uiListenerMiddleware.startListening({
  actionCreator: toggleTheme,
  effect: (_, listenerApi) => {
    const state = listenerApi.getState() as {
      ui: { theme: 'dark' | 'light' };
    };

    const theme = state.ui.theme;

    localStorage.setItem('ff-theme', theme);
    applyTheme(theme);
  }
});

// Apply system theme only when no saved preference exists
uiListenerMiddleware.startListening({
  actionCreator: setSystemTheme,
  effect: (_, listenerApi) => {
    if (localStorage.getItem('ff-theme')) {
      return;
    }

    const state = listenerApi.getState() as {
      ui: { theme: 'dark' | 'light' };
    };

    applyTheme(state.ui.theme);
  }
});

// Persist active project
uiListenerMiddleware.startListening({
  actionCreator: setActiveProject,
  effect: (action) => {
    sessionStorage.setItem('ff-project', action.payload);
  }
});

// Remove persisted active project
uiListenerMiddleware.startListening({
  actionCreator: clearActiveProject,
  effect: () => {
    sessionStorage.removeItem('ff-project');
  }
});