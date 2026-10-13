import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { renderWithProviders } from '../utils';
import Header from '../../components/Header';
import { mockUser, mockProjects } from '../mocks/data';

// Helper: render Header at a given route
const renderHeader = (pathname = '/app', authenticated = true) =>
  renderWithProviders(<Header />, {
    routerProps: { initialEntries: [pathname] },
    authenticatedAs: authenticated ? mockUser : undefined
  });

describe('Header', () => {
  it('does not render a sidebar toggle in the header', () => {
    renderHeader('/app');
    expect(screen.queryByLabelText(/sidebar/i)).not.toBeInTheDocument();
  });

  // ─── Theme Toggle ──────────────────────────────────────────────────────────
  describe('theme toggle', () => {
    it('renders the theme toggle button', () => {
      renderHeader('/app');
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('dispatches toggleTheme action when clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderHeader('/app');

      const initialTheme = store.getState().ui.theme;
      await user.click(screen.getByLabelText('Toggle theme'));
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
