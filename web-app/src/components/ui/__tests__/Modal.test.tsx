import { render, screen } from '@testing-library/react';
import Modal from '../Modal';
import { describe, it, expect } from 'vitest';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });
}); 