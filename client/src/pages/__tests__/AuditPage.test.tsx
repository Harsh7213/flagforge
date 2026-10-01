import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import AuditPage from '../AuditPage';
import { mockUser, mockProjects } from '../../test/mocks/data';

describe('AuditPage', () => {
  it('renders Audit Log header and timeline events', async () => {
    renderWithProviders(<AuditPage />, {
      authenticatedAs: mockUser,
      preloadedState: {
        ui: { activeProjectId: mockProjects[0].id, sidebarOpen: true, theme: 'light', toasts: [] }
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Audit Log/i)).toBeInTheDocument();
    });
  });
});
