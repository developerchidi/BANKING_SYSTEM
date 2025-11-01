import { useState, useCallback } from 'react';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (config?: AxiosRequestConfig) => Promise<T>;
  reset: () => void;
}

export function useApi<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (config?: AxiosRequestConfig): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response: AxiosResponse<T> = await axios({
          method,
          url,
          ...config,
        });

        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        return response.data;
      } catch (error) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'An unexpected error occurred';

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [url, method]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
} 