import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';
import { describe, it, expect, beforeEach } from 'vitest';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should return initial value if nothing in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('should set and get value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'init'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('should remove value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'init'));
    act(() => {
      result.current[1]('abc');
      result.current[2]();
    });
    expect(result.current[0]).toBe('init');
    expect(window.localStorage.getItem('test-key')).toBeNull();
  });
}); 