import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import Dashboard from '../Dashboard';
import { mockUser, mockProjects } from '../../test/mocks/data';

describe('Dashboard Page', () => {
  it('renders no project selected message when no active project', async () => {
    renderWithProviders(<Dashboard />, {
      authenticatedAs: mockUser,
      preloadedState: {
        ui: { activeProjectId: null, sidebarOpen: true, theme: 'light', toasts: [] }
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/No project selected/i)).toBeInTheDocument();
    });
  });

  it('renders stats cards and recent activity for active project', async () => {
    renderWithProviders(<Dashboard />, {
      authenticatedAs: mockUser,
      preloadedState: {
        ui: { activeProjectId: mockProjects[0].id, sidebarOpen: true, theme: 'light', toasts: [] }
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Total Flags/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Flags/i)).toBeInTheDocument();
      expect(screen.getByText(/Environment Breakdown/i)).toBeInTheDocument();
    });
  });

  it('renders manage flags button', async () => {
    renderWithProviders(<Dashboard />, {
      authenticatedAs: mockUser,
      preloadedState: {
        ui: { activeProjectId: mockProjects[0].id, sidebarOpen: true, theme: 'light', toasts: [] }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Manage Flags →/i })).toBeInTheDocument();
    });
  });
});
