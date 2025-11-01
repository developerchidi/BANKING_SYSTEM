import { renderHook, act } from '@testing-library/react';
import { useApi } from '../useApi';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockRequest: any;
let isAxiosError = false;
vi.mock('axios', () => {
  const axiosMock = Object.assign(
    (...args: any[]) => mockRequest(...args),
    {
      request: (...args: any[]) => mockRequest(...args),
      isAxiosError: () => isAxiosError,
    }
  );
  return {
    default: axiosMock,
    __esModule: true,
  };
});
import axios from 'axios';

describe('useApi', () => {
  beforeEach(() => {
    mockRequest = undefined;
    isAxiosError = false;
  });

  it('should fetch data successfully', async () => {
    mockRequest = vi.fn().mockResolvedValueOnce({ data: { foo: 'bar' } });
    const { result } = renderHook(() => useApi('/api/test', 'GET'));
    await act(async () => {
      const data = await result.current.execute();
      expect(data).toEqual({ foo: 'bar' });
    });
    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle error', async () => {
    isAxiosError = true;
    const errorObj = { message: 'fail' };
    mockRequest = vi.fn().mockRejectedValueOnce(errorObj);
    const { result } = renderHook(() => useApi('/api/test', 'GET'));
    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow('fail');
    });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('fail');
  });
}); 