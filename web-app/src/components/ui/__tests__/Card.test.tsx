import { render, screen } from '@testing-library/react';
import Card from '../Card';
import { describe, it, expect } from 'vitest';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Test</Card>);
    const region = screen.getByRole('region');
    expect(region).toHaveClass('custom-class');
  });
}); 