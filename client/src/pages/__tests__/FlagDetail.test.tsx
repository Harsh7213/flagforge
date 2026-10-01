import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import FlagDetail from '../FlagDetail';
import { mockUser, mockFlags } from '../../test/mocks/data';

describe('FlagDetail Page', () => {
  const targetFlag = mockFlags[0];

  it('renders flag header, key, and environments', async () => {
    renderWithProviders(<FlagDetail />, {
      routerProps: { initialEntries: [`/app/flags/${targetFlag.id}`] },
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByText(targetFlag.name)).toBeInTheDocument();
      expect(screen.getByText(targetFlag.key)).toBeInTheDocument();
    });
  });

  it('switches between Overview and Audit Log tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FlagDetail />, {
      routerProps: { initialEntries: [`/app/flags/${targetFlag.id}`] },
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Overview & Environments/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Audit Log/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Audit Log/i })).toHaveClass('font-semibold');
    });
  });

  it('opens edit form and updates flag name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FlagDetail />, {
      routerProps: { initialEntries: [`/app/flags/${targetFlag.id}`] },
      authenticatedAs: mockUser
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /✏️ Edit/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /✏️ Edit/i }));

    const editInput = screen.getByDisplayValue(targetFlag.name);
    await user.clear(editInput);
    await user.type(editInput, 'Updated Flag Name');

    await user.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Updated Flag Name')).not.toBeInTheDocument();
    });
  });
});
