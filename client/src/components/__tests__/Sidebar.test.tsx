import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import Sidebar from '../Sidebar';
import { mockUser, mockMemberUser, mockAdminUser } from '../../test/mocks/data';

// Mock useNavigate so we can assert redirect calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderSidebar = (user = mockUser, sidebarOpen = true) =>
  renderWithProviders(<Sidebar />, {
    routerProps: { initialEntries: ['/app'] },
    authenticatedAs: user,
    preloadedState: { ui: { theme: 'light', activeProjectId: null, sidebarOpen, toasts: [] } }
  });

describe('Sidebar', () => {
  // ─── Nav Items ─────────────────────────────────────────────────────────────
  describe('navigation items', () => {
    it('renders the primary navigation items', () => {
      renderSidebar();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  // ─── Role-based visibility (Team link) ─────────────────────────────────────
  describe('Team link visibility', () => {
    it('shows Team nav for owner role', () => {
      renderSidebar(mockUser); // mockUser is owner
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('shows Team nav for admin role', () => {
      renderSidebar(mockAdminUser);
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('hides Team nav for member role', () => {
      renderSidebar(mockMemberUser);
      expect(screen.queryByText('Team')).not.toBeInTheDocument();
    });
  });

  // ─── Sidebar open/closed states ───────────────────────────────────────────
  describe('open/collapsed states', () => {
    it('shows expanded content when sidebar is open', () => {
      renderSidebar(mockUser, true);
      expect(screen.getByText('FlagForge')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('hides expanded content when sidebar is collapsed', () => {
      renderSidebar(mockUser, false);
      expect(screen.queryByText('FlagForge')).not.toBeInTheDocument();
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    });
  });

  // ─── User Info ─────────────────────────────────────────────────────────────
  describe('user info', () => {
    it('shows the user name, organization, and initials', () => {
      renderSidebar(mockUser, true);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      // "A" is the first letter of "Alice Smith"
      const avatars = screen.getAllByText('A');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  // ─── Logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('logs out and redirects to /login when logout button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderSidebar();

      // Find and click logout button (⏻ icon)
      const logoutBtn = screen.getByTitle('Log out');
      await user.click(logoutBtn);

      // The sidebar's handleLogout dispatches logout() in a `finally` block,
      // so it always clears auth state regardless of API result.
      await waitFor(() => {
        expect(store.getState().auth.user).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      });
    });
  });
});
