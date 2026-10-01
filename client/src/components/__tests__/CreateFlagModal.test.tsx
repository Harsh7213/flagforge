import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import CreateFlagModal from '../CreateFlagModal';
import { mockUser } from '../../test/mocks/data';

describe('CreateFlagModal', () => {
  const onClose = vi.fn();

  it('renders modal header and form fields', () => {
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    expect(screen.getByText(/Create Feature Flag/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Flag Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Flag Key \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('auto-generates flag key from flag name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    const nameInput = screen.getByLabelText(/Flag Name \*/i);
    await user.type(nameInput, 'New Beta Feature');

    const keyInput = screen.getByLabelText(/Flag Key \*/i) as HTMLInputElement;
    expect(keyInput.value).toBe('new_beta_feature');
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    const submitBtn = screen.getByRole('button', { name: /Create Flag/i });
    await user.click(submitBtn);

    expect(screen.getByText(/Flag name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Flag key is required/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button or cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    const closeBtn = screen.getByLabelText('Close dialog');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('submits valid form data and closes modal', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(
      <CreateFlagModal projectId="proj-1" onClose={onClose} />,
      {
        authenticatedAs: mockUser
      }
    );

    await user.type(screen.getByLabelText(/Flag Name \*/i), 'Test Flag');
    await user.type(screen.getByLabelText(/Description/i), 'Optional description');

    const submitBtn = screen.getByRole('button', { name: /Create Flag/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
