import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import RulesEditor from '../RulesEditor';
import { mockUser, mockFlags } from '../../test/mocks/data';

describe('RulesEditor', () => {
  const mockEnvNoRules = mockFlags[0].environments.find(e => e.environment === 'development')!;
  const mockEnvWithRules = {
    ...mockFlags[0].environments[1],
    rules: [
      {
        id: 'rule-1',
        flag_environment_id: mockFlags[0].environments[1].id,
        type: 'user_ids' as const,
        value: JSON.stringify(['user-10', 'beta-testers']),
        created_at: '2024-03-15T10:00:00.000Z'
      }
    ]
  };

  it('renders "No targeting rules" placeholder when rules list is empty', () => {
    renderWithProviders(<RulesEditor flagId={mockFlags[0].id} environment={mockEnvNoRules} />, {
      authenticatedAs: mockUser
    });

    expect(screen.getByText(/No targeting rules/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add Rule/i })).toBeInTheDocument();
  });

  it('renders existing targeting rules', () => {
    renderWithProviders(<RulesEditor flagId={mockFlags[0].id} environment={mockEnvWithRules} />, {
      authenticatedAs: mockUser
    });

    expect(screen.getByText(/beta-testers/i)).toBeInTheDocument();
  });

  it('opens and closes add rule form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RulesEditor flagId={mockFlags[0].id} environment={mockEnvNoRules} />, {
      authenticatedAs: mockUser
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Rule/i }));

    expect(screen.getByLabelText(/Rule Type/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.queryByLabelText(/Rule Type/i)).not.toBeInTheDocument();
  });

  it('submits a new user_ids rule successfully', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RulesEditor flagId={mockFlags[0].id} environment={mockEnvNoRules} />, {
      authenticatedAs: mockUser
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Rule/i }));
    await user.type(screen.getByRole('textbox'), 'user-99');

    await user.click(screen.getByRole('button', { name: /Add Rule/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/Rule Type/i)).not.toBeInTheDocument();
    });
  });
});
