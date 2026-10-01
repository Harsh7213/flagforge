import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import Login from '../Login';

import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('Login Page', () => {
  it('renders login form elements', () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('shows error toast when login fails with invalid credentials', async () => {
    server.use(
      http.post('http://localhost/api/v1/auth/login', () => {
        return HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      })
    );
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/Email address/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'WrongPassword123!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(store.getState().ui.toasts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'error', message: 'Invalid email or password' })
        ])
      );
    });
  });

  it('submits valid credentials and updates auth state', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/Email address/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(store.getState().auth.user).not.toBeNull();
    });
  });
});
