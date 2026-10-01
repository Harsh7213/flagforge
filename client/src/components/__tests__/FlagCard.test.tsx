import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { renderWithProviders } from '../../test/utils';
import FlagCard from '../FlagCard';
import { mockFlag, mockArchivedFlag, mockUser } from '../../test/mocks/data';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderFlagCard = (flag = mockFlag) =>
  renderWithProviders(<FlagCard flag={flag} />, {
    routerProps: { initialEntries: ['/app/flags'] },
    authenticatedAs: mockUser
  });

describe('FlagCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────
  describe('rendering', () => {
    it('renders the flag summary', () => {
      renderFlagCard();
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(screen.getByText('dark_mode')).toBeInTheDocument();
      expect(screen.getByText('Enable dark mode for users')).toBeInTheDocument();
      const formatted = new Date(mockFlag.created_at).toLocaleDateString();
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });

    it('does not render description when it is null', () => {
      renderFlagCard(mockArchivedFlag);
      expect(screen.queryByText('Enable dark mode for users')).not.toBeInTheDocument();
    });
  });

  // ─── Archived Badge ────────────────────────────────────────────────────────
  describe('archived badge', () => {
    it('shows Archived badge for archived flags', () => {
      renderFlagCard(mockArchivedFlag);
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('does NOT show Archived badge for active flags', () => {
      renderFlagCard(mockFlag);
      expect(screen.queryByText('Archived')).not.toBeInTheDocument();
    });
  });

  // ─── Environment Toggles ───────────────────────────────────────────────────
  describe('environment toggles', () => {
    it('renders a toggle for each environment', () => {
      renderFlagCard();
      expect(screen.getByText('Dev')).toBeInTheDocument();
      expect(screen.getByText('Staging')).toBeInTheDocument();
      expect(screen.getByText('Prod')).toBeInTheDocument();
    });
  });

  // ─── Navigation ───────────────────────────────────────────────────────────
  describe('navigation', () => {
    it('navigates to flag detail when the card is clicked', async () => {
      const user = userEvent.setup();
      renderFlagCard();
      await user.click(screen.getByRole('button', { name: /Feature flag: Dark Mode/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/app/flags/flag-1');
    });

    it('navigates to flag detail when "Edit →" button is clicked', async () => {
      const user = userEvent.setup();
      renderFlagCard();
      await user.click(screen.getByText('Edit →'));
      expect(mockNavigate).toHaveBeenCalledWith('/app/flags/flag-1');
    });

    it('navigates when Enter key is pressed on the card', async () => {
      renderFlagCard();
      const card = screen.getByRole('button', { name: /Feature flag: Dark Mode/i });
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/app/flags/flag-1');
    });
  });

  // ─── Environment Toggle Interaction ────────────────────────────────────────
  describe('environment toggle interaction', () => {
    it('calls toggleEnvironment API when Dev toggle is clicked', async () => {
      const user = userEvent.setup();
      let apiCalled = false;

      server.use(
        http.post('http://localhost/api/v1/flags/:flagId/environments/:env/toggle', () => {
          apiCalled = true;
          return new HttpResponse(null, { status: 200 });
        })
      );

      renderFlagCard();
      await user.click(screen.getByTitle('Disable in development'));

      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
    });

    it('shows optimistic update immediately on toggle (before API responds)', async () => {
      const user = userEvent.setup();

      // Simulate a slow API
      server.use(
        http.post('/api/v1/flags/:flagId/environments/:env/toggle', async () => {
          await new Promise(r => setTimeout(r, 500));
          return new HttpResponse(null, { status: 200 });
        })
      );

      renderFlagCard();

      // Dev is enabled in mockFlag, click should show "Enable" title after optimistic toggle
      await user.click(screen.getByTitle('Disable in development'));

      // Immediately after click (before API resolves), the UI should show disabled state
      expect(screen.getByTitle('Enable in development')).toBeInTheDocument();
    });

    it('dispatches a success toast on successful toggle', async () => {
      const user = userEvent.setup();
      const { store } = renderFlagCard();

      await user.click(screen.getByTitle('Disable in development'));

      await waitFor(() => {
        const toasts = store.getState().ui.toasts;
        expect(toasts.some(t => t.type === 'success')).toBe(true);
      });
    });

    it('reverts optimistic state and shows error toast on API failure', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/v1/flags/:flagId/environments/:env/toggle', () =>
          HttpResponse.json({ error: 'Server Error' }, { status: 500 })
        )
      );

      const { store } = renderFlagCard();
      await user.click(screen.getByTitle('Disable in development'));

      await waitFor(() => {
        const toasts = store.getState().ui.toasts;
        expect(toasts.some(t => t.type === 'error')).toBe(true);
      });

      // Should revert to original state (Dev was enabled, so "Disable" title reappears)
      expect(screen.getByTitle('Disable in development')).toBeInTheDocument();
    });

    it('does NOT call toggleEnvironment on archived flags', async () => {
      const user = userEvent.setup();
      let apiCalled = false;

      server.use(
        http.post('http://localhost/api/v1/flags/:flagId/environments/:env/toggle', () => {
          apiCalled = true;
          return new HttpResponse(null, { status: 200 });
        })
      );

      renderFlagCard(mockArchivedFlag);
      await user.click(screen.getByTitle('Enable in development'));

      await new Promise(r => setTimeout(r, 100));
      expect(apiCalled).toBe(false);
    });
  });
});
