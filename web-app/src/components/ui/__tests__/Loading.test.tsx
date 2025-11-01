import { render, screen } from '@testing-library/react';
import { Loading } from '../Loading';
import { describe, it, expect } from 'vitest';

describe('Loading', () => {
  it('renders spinner by default', () => {
    render(<Loading />);
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders text if provided', () => {
    render(<Loading text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
}); 