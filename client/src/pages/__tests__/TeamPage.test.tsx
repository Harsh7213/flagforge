import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import TeamPage from '../TeamPage';
import { mockUser, mockMemberUser } from '../../test/mocks/data';

describe('TeamPage', () => {
  it('shows permission message for member role', () => {
    renderWithProviders(<TeamPage />, {
      authenticatedAs: mockMemberUser
    });

    expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
  });

  it('renders invitation form and member list for owner role', async () => {
    renderWithProviders(<TeamPage />, {
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByText(/Invite your team/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Work email/i)).toBeInTheDocument();
    });
  });

  it('submits email and generates invitation link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamPage />, {
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Work email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Work email/i), 'newuser@example.com');
    await user.click(screen.getByRole('button', { name: /Create invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invitation ready for testing/i)).toBeInTheDocument();
    });
  });
});
