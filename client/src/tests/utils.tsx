import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { flagsApi } from '../store/api/flagsApi';
import { projectsApi } from '../store/api/projectsApi';
import { authApi } from '../store/api/authApi';
import { organizationApi } from '../store/api/organizationApi';
import uiReducer from '../store/slices/uiSlice';
import authReducer from '../store/slices/authSlice';
import type { User } from '../store/slices/authSlice';

type TestRootState = {
  ui: ReturnType<typeof uiReducer>;
  auth: ReturnType<typeof authReducer>;
  [flagsApi.reducerPath]: ReturnType<typeof flagsApi.reducer>;
  [projectsApi.reducerPath]: ReturnType<typeof projectsApi.reducer>;
  [authApi.reducerPath]: ReturnType<typeof authApi.reducer>;
  [organizationApi.reducerPath]: ReturnType<typeof organizationApi.reducer>;
};

// ─── Store Factory ────────────────────────────────────────────────────────────
/**
 * Creates a fresh Redux store for each test.
 * Pass `preloadedState` to seed initial auth/ui state without dispatching actions.
 */
export function createTestStore(preloadedState?: Partial<TestRootState>) {
  const reducer = {
    ui: uiReducer,
    auth: authReducer,
    [flagsApi.reducerPath]: flagsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer
  } as never;

  return configureStore({
    reducer,
    middleware: (getDefaultMiddleware: unknown) => {
      const defaultMiddleware = getDefaultMiddleware as () => {
        concat: (...args: unknown[]) => unknown;
      };

      return defaultMiddleware().concat(
        flagsApi.middleware,
        projectsApi.middleware,
        authApi.middleware,
        organizationApi.middleware
      ) as never;
    },
    preloadedState
  } as never);
}

// ─── Render Options ───────────────────────────────────────────────────────────
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<TestRootState>;
  routerProps?: MemoryRouterProps;
  /** Shortcut: seed an authenticated user without building full preloadedState */
  authenticatedAs?: User;
}

/**
 * renderWithProviders — drop-in replacement for RTL's `render()`.
 * Wraps the component under test in Redux Provider + MemoryRouter.
 *
 * @example
 * const { getByText } = renderWithProviders(<Header />, {
 *   routerProps: { initialEntries: ['/app/flags'] },
 *   authenticatedAs: mockUser,
 * });
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    routerProps = { initialEntries: ['/'] },
    authenticatedAs,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const mergedState: Partial<TestRootState> = {
    ...preloadedState,
    auth: {
      user: authenticatedAs !== undefined ? authenticatedAs : (preloadedState?.auth?.user ?? null),
      sessionExpiresAt: authenticatedAs
        ? Date.now() + 60 * 60 * 1000
        : (preloadedState?.auth?.sessionExpiresAt ?? null)
    }
  };

  const store = createTestStore(mergedState);

  const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter {...routerProps}>{children}</MemoryRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}
