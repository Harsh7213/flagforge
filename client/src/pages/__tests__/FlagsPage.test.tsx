import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import FlagsPage from '../FlagsPage';
import { mockUser, mockProjects } from '../../test/mocks/data';

describe('FlagsPage', () => {
  it('renders flags page header and create flag button', async () => {
    renderWithProviders(<FlagsPage />, {
      authenticatedAs: mockUser,
      preloadedState: {
        ui: { activeProjectId: mockProjects[0].id, sidebarOpen: true, theme: 'light', toasts: [] }
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Feature Flags/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ New Flag/i })).toBeInTheDocument();
    });
  });

  it('opens Create Flag modal on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FlagsPage />, {
      authenticatedAs: mockUser,
      preloadedState: {
        ui: { activeProjectId: mockProjects[0].id, sidebarOpen: true, theme: 'light', toasts: [] }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ New Flag/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ New Flag/i }));

    expect(screen.getByLabelText(/Flag Name \*/i)).toBeInTheDocument();
  });
});
