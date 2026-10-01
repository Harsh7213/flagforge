import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import AuditTimeline from '../AuditTimeline';
import { mockAuditLog } from '../../test/mocks/data';

describe('AuditTimeline', () => {
  it('renders "No audit events yet" when logs list is empty', () => {
    renderWithProviders(<AuditTimeline logs={[]} />);
    expect(screen.getByText(/No audit events yet/i)).toBeInTheDocument();
  });

  it('renders audit events with action badge, flag key, and actor', () => {
    renderWithProviders(<AuditTimeline logs={[mockAuditLog]} />);

    expect(screen.getByText(mockAuditLog.action)).toBeInTheDocument();
    expect(screen.getByText(mockAuditLog.flag_key)).toBeInTheDocument();
    expect(screen.getByText(mockAuditLog.actor)).toBeInTheDocument();
  });
});
