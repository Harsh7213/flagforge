import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils';
import CreateFlagModal from '../../components/CreateFlagModal';
import { mockFlags, mockUser } from '../mocks/data';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { INPUT_LIMITS } from '../../../../shared/inputLimits';

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
    expect((screen.getByLabelText(/Flag Name \*/i) as HTMLInputElement).maxLength).toBe(
      INPUT_LIMITS.flagName
    );
    expect((screen.getByLabelText(/Flag Key \*/i) as HTMLInputElement).maxLength).toBe(
      INPUT_LIMITS.flagKey
    );
    expect((screen.getByLabelText(/Description/i) as HTMLTextAreaElement).maxLength).toBe(
      INPUT_LIMITS.flagDescription
    );
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

  it('clears required key validation when the name generates a key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    await user.click(screen.getByRole('button', { name: /Create Flag/i }));
    await user.type(screen.getByLabelText(/Flag Name \*/i), 'test_flag');

    expect(screen.queryByText('Flag key is required')).not.toBeInTheDocument();
  });

  it('keeps spaces in the name and removes special characters as typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    const nameInput = screen.getByLabelText(/Flag Name \*/i) as HTMLInputElement;
    await user.type(nameInput, 'New Beta! Feature@');

    expect(nameInput.value).toBe('New Beta Feature');
    expect((screen.getByLabelText(/Flag Key \*/i) as HTMLInputElement).value).toBe(
      'new_beta_feature'
    );
  });

  it('collapses repeated spaces in the name sent to the backend', async () => {
    const user = userEvent.setup();
    let submittedName = '';
    server.use(
      http.post('http://localhost/api/v1/flags', async ({ request }) => {
        const body = (await request.json()) as { name: string };
        submittedName = body.name;
        return HttpResponse.json({ data: { ...mockFlags[0], name: body.name } });
      })
    );
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    await user.type(screen.getByLabelText(/Flag Name \*/i), 'pico    ctf');
    await user.click(screen.getByRole('button', { name: /Create Flag/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(submittedName).toBe('pico ctf');
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
    renderWithProviders(<CreateFlagModal projectId="proj-1" onClose={onClose} />, {
      authenticatedAs: mockUser
    });

    await user.type(screen.getByLabelText(/Flag Name \*/i), 'test_flag');
    await user.type(screen.getByLabelText(/Description/i), 'Optional description');

    const submitBtn = screen.getByRole('button', { name: /Create Flag/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
