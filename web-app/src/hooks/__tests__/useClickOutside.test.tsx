import { render, fireEvent } from '@testing-library/react';
import { useClickOutside } from '../useClickOutside';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('useClickOutside', () => {
  it('calls handler when clicking outside', () => {
    const handler = vi.fn();
    function TestComponent() {
      const ref = useClickOutside<HTMLDivElement>(handler);
      return <div ref={ref}>Inside</div>;
    }
    render(<TestComponent />);
    fireEvent.mouseDown(document);
    expect(handler).toHaveBeenCalled();
  });

  it('does not call handler when clicking inside', () => {
    const handler = vi.fn();
    function TestComponent() {
      const ref = useClickOutside<HTMLDivElement>(handler);
      return <div ref={ref} data-testid="inside">Inside</div>;
    }
    const { getByTestId } = render(<TestComponent />);
    fireEvent.mouseDown(getByTestId('inside'));
    expect(handler).not.toHaveBeenCalled();
  });
}); 