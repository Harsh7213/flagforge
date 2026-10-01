import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import LandingPage from '../LandingPage';

describe('LandingPage', () => {
  it('renders landing page hero title and navigation links', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByText(/Multi-tenant Feature Flag Management/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Get Started/i }).length).toBeGreaterThan(0);
  });
});
