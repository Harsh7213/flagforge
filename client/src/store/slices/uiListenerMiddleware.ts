import { startAppListening } from '../store';
import { toggleTheme, setSystemTheme, setActiveProject, clearActiveProject } from './uiSlice';
import { applyTheme } from '../../utils/applyTheme';

export const registerUiListeners= (startListening: typeof startAppListening) => {
  // Toggle theme: persist preference and apply theme
  startListening({
    actionCreator: toggleTheme,
    effect: (_, listenerApi) => {
      const theme = listenerApi.getState().ui.theme;
      localStorage.setItem('ff-theme', theme);
      applyTheme(theme);
    }
  });

  // Apply system theme only when no saved preference exists
  startListening({
    actionCreator: setSystemTheme,
    effect: (_, listenerApi) => {
      if (localStorage.getItem('ff-theme')) {
        return;
      }
      const theme = listenerApi.getState().ui.theme;
      applyTheme(theme);
    }
  });

  // Persist active project
  startListening({
    actionCreator: setActiveProject,
    effect: action => {
      sessionStorage.setItem('ff-project', action.payload);
    }
  });

  // Remove persisted active project
  startListening({
    actionCreator: clearActiveProject,
    effect: () => {
      sessionStorage.removeItem('ff-project');
    }
  });
};
