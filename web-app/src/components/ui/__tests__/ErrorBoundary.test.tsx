import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { describe, it, expect } from 'vitest';

function ProblemChild() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI on error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
}); 