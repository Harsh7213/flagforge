import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../test/utils';
import AcceptInvitationPage from '../AcceptInvitationPage';

describe('AcceptInvitationPage', () => {
  it('renders invitation form fields when token is present', () => {
    renderWithProviders(
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitationPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/invite/token-123'] }
      }
    );

    expect(screen.getByRole('heading', { name: /Join your organization/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('submits name and password to accept invitation', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(
      <Routes>
        <Route path="/invite/:token" element={<AcceptInvitationPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/invite/token-123'] }
      }
    );

    await user.type(screen.getByLabelText(/Your name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/Password/i), 'SuperSecretPassword123!');

    await user.click(screen.getByRole('button', { name: /Accept invitation/i }));

    await waitFor(() => {
      expect(store.getState().auth.user).not.toBeNull();
    });
  });
});
