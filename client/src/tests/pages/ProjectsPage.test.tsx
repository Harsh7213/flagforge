import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils';
import ProjectsPage from '../../pages/ProjectsPage';
import { mockUser, mockProjects } from '../mocks/data';
import { INPUT_LIMITS } from '../../../../shared/inputLimits';

describe('ProjectsPage', () => {
  it('renders projects header and lists project names', async () => {
    renderWithProviders(<ProjectsPage />, {
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByText(mockProjects[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockProjects[1].name)).toBeInTheDocument();
    });
  });

  it('opens create project form and creates project', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />, {
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ New Project/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ New Project/i }));

    const input = screen.getByPlaceholderText(/Project name/i);
    expect((input as HTMLInputElement).maxLength).toBe(INPUT_LIMITS.projectName);
    await user.type(input, 'New Analytics App');

    await user.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Project name/i)).not.toBeInTheDocument();
    });
  });

  it('limits renamed project names to 20 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />, {
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Rename/i })[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /Rename/i })[0]);

    expect((screen.getByRole('textbox', { name: 'Project name' }) as HTMLInputElement).maxLength)
      .toBe(INPUT_LIMITS.projectName);
  });

  it('allows setting active project', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ProjectsPage />, {
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Set Active/i })[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /Set Active/i })[0]);

    expect(store.getState().ui.activeProjectId).not.toBeNull();
  });
});
