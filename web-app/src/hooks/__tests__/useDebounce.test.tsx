import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';
import { describe, it, expect, vi } from 'vitest';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 500 },
    });

    expect(result.current).toBe('a');

    rerender({ value: 'b', delay: 500 });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('b');
    vi.useRealTimers();
  });
}); 