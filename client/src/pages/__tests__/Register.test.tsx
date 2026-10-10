import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import Register from '../Register';
import { INPUT_LIMITS } from '../../../../server/src/config/inputLimits';

describe('Register Page', () => {
  it('renders registration form fields', () => {
    renderWithProviders(<Register />);

    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Work Email/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/Organization Name/i) as HTMLInputElement).maxLength).toBe(
      INPUT_LIMITS.organizationName
    );
    expect((screen.getByLabelText(/Your Name/i) as HTMLInputElement).maxLength).toBe(
      INPUT_LIMITS.userName
    );
    expect((screen.getByLabelText(/Work Email/i) as HTMLInputElement).maxLength).toBe(
      INPUT_LIMITS.email
    );
    expect((screen.getByLabelText(/Password/i) as HTMLInputElement).minLength).toBe(
      INPUT_LIMITS.passwordMinimum
    );
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('registers user and updates store auth state', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Register />);

    await user.type(screen.getByLabelText(/Your Name/i), 'Bob Builder');
    await user.type(screen.getByLabelText(/Work Email/i), 'bob@example.com');
    await user.type(screen.getByLabelText(/Organization Name/i), 'Acme Inc');
    await user.type(screen.getByLabelText(/Password/i), 'Password123!456');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(store.getState().auth.user).not.toBeNull();
    });
  });
});
