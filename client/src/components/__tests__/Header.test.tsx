import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { renderWithProviders } from '../../test/utils';
import Header from '../Header';
import { mockUser, mockProjects } from '../../test/mocks/data';

// Helper: render Header at a given route
const renderHeader = (pathname = '/app', authenticated = true) =>
  renderWithProviders(<Header />, {
    routerProps: { initialEntries: [pathname] },
    authenticatedAs: authenticated ? mockUser : undefined
  });

describe('Header', () => {
  // ─── Page Titles ───────────────────────────────────────────────────────────
  describe('page titles', () => {
    it('shows "Dashboard" at /app', async () => {
      renderHeader('/app');
      expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    });

    it('shows "Feature Flags" at /app/flags', async () => {
      renderHeader('/app/flags');
      expect(await screen.findByText('Feature Flags')).toBeInTheDocument();
    });

    it('shows "Audit Log" at /app/audit', async () => {
      renderHeader('/app/audit');
      expect(await screen.findByText('Audit Log')).toBeInTheDocument();
    });

    it('shows "Projects" at /app/projects', async () => {
      renderHeader('/app/projects');
      expect(await screen.findByText('Projects')).toBeInTheDocument();
    });

    it('shows "Team" at /app/team', async () => {
      renderHeader('/app/team');
      expect(await screen.findByText('Team')).toBeInTheDocument();
    });

    it('shows "FlagForge" for unknown routes', async () => {
      renderHeader('/app/unknown-route');
      expect(await screen.findByText('FlagForge')).toBeInTheDocument();
    });
  });

  // ─── Sidebar Toggle ────────────────────────────────────────────────────────
  describe('sidebar toggle', () => {
    it('renders the sidebar toggle button', () => {
      renderHeader('/app');
      expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
    });

    it('dispatches toggleSidebar action when clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderHeader('/app');

      const initialOpen = store.getState().ui.sidebarOpen;
      await user.click(screen.getByLabelText('Toggle sidebar'));
      expect(store.getState().ui.sidebarOpen).toBe(!initialOpen);
    });
  });

  // ─── Theme Toggle ──────────────────────────────────────────────────────────
  describe('theme toggle', () => {
    it('renders the theme toggle button', () => {
      renderHeader('/app');
      expect(screen.getByLabelText('Toggle color theme')).toBeInTheDocument();
    });

    it('dispatches toggleTheme action when clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderHeader('/app');

      const initialTheme = store.getState().ui.theme;
      await user.click(screen.getByLabelText('Toggle color theme'));
      expect(store.getState().ui.theme).not.toBe(initialTheme);
    });
  });

  // ─── Project Selector ─────────────────────────────────────────────────────
  describe('project selector', () => {
    it('shows project selector when projects exist', async () => {
      renderHeader('/app');
      // MSW returns mockProjects by default
      expect(await screen.findByLabelText('Select active project')).toBeInTheDocument();
    });

    it('does NOT show project selector when there are no projects', async () => {
      server.use(
        http.get('http://localhost/api/v1/projects', () => HttpResponse.json({ data: [] }))
      );
      renderHeader('/app');
      await waitFor(() => {
        expect(screen.queryByLabelText('Select active project')).not.toBeInTheDocument();
      });
    });

    it('lists project names as options', async () => {
      renderHeader('/app');
      await screen.findByLabelText('Select active project');
      expect(screen.getByText(/My App/)).toBeInTheDocument();
      expect(screen.getByText(/Mobile App/)).toBeInTheDocument();
    });

    it('dispatches setActiveProject when a project is selected', async () => {
      const user = userEvent.setup();
      const { store } = renderHeader('/app');

      const selector = await screen.findByLabelText('Select active project');
      await user.selectOptions(selector, mockProjects[0].id);

      expect(store.getState().ui.activeProjectId).toBe(mockProjects[0].id);
    });
  });
});
