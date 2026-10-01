import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { renderWithProviders } from '../../test/utils';
import AuthGuard from '../AuthGuard';
import { mockUser } from '../../test/mocks/data';

// Mock useNavigate / Navigate so we can assert redirects
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div data-testid="navigate" data-to={to} />;
    },
    Outlet: () => <div data-testid="outlet">Protected Content</div>
  };
});

describe('AuthGuard', () => {
  // ─── Loading State ─────────────────────────────────────────────────────────
  it('renders an empty loading div while the /me query is in flight', () => {
    // Simulate a slow /me endpoint
    server.use(
      http.get('/api/v1/auth/me', async () => {
        await new Promise(r => setTimeout(r, 2000));
        return HttpResponse.json({});
      })
    );

    const { container } = renderWithProviders(<AuthGuard />, {
      routerProps: { initialEntries: ['/app'] }
    });

    // The loading state renders a bare div with min-h-screen
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
  });

  // ─── Unauthenticated ───────────────────────────────────────────────────────
  it('redirects to /login when /me returns an error', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    renderWithProviders(<AuthGuard />, {
      routerProps: { initialEntries: ['/app'] }
    });

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });
  });

  it('redirects to /login when auth state has no user', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    renderWithProviders(<AuthGuard />, {
      routerProps: { initialEntries: ['/app'] },
      preloadedState: { auth: { user: null, sessionExpiresAt: null } }
    });

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });
  });

  // ─── Session Expired ───────────────────────────────────────────────────────
  it('redirects to /login when session has already expired', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    renderWithProviders(<AuthGuard />, {
      routerProps: { initialEntries: ['/app'] },
      preloadedState: {
        auth: {
          user: mockUser,
          sessionExpiresAt: Date.now() - 1000 // already expired
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });
  });

  // ─── Authenticated ─────────────────────────────────────────────────────────
  it('renders the Outlet (protected content) when user is authenticated and session is valid', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({
          data: { user: mockUser, expiresAt: Date.now() + 3600000 }
        })
      )
    );

    renderWithProviders(<AuthGuard />, {
      routerProps: { initialEntries: ['/app'] },
      authenticatedAs: mockUser,
      preloadedState: {
        auth: {
          user: mockUser,
          sessionExpiresAt: Date.now() + 3600000
        }
      }
    });

    expect(await screen.findByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
