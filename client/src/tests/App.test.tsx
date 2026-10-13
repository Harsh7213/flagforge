import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { createTestStore } from './utils';
import App from '../App';
import { mockUser } from './mocks/data';

describe('App Component', () => {
  it('renders landing page at root route / when unauthenticated', async () => {
    server.use(
      http.get('http://localhost/api/v1/auth/me', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    window.history.pushState({}, 'Test page', '/');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Feature Flag Management/i)).toBeInTheDocument();
    });
  });

  it('renders login route /login when unauthenticated', async () => {
    server.use(
      http.get('http://localhost/api/v1/auth/me', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    window.history.pushState({}, 'Test page', '/login');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    });
  });

  it('renders login after a protected route redirects for an invalid session', async () => {
    server.use(
      http.get('http://localhost/api/v1/auth/me', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    window.history.pushState({}, 'Test page', '/app');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    });
  });

  it('renders dashboard route /app when authenticated', async () => {
    window.history.pushState({}, 'Test page', '/app');
    const store = createTestStore({
      auth: { user: mockUser, sessionExpiresAt: Date.now() + 3600000 }
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    });
  });
});
