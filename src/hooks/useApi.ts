import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';

export interface ApiResponse<T = any> {
  data?: T;
  success: boolean;
  message?: string;
  error?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const useApi = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getHeaders = useCallback((customHeaders?: Record<string, string>): Record<string, string> => {
    const token = localStorage.getItem('matchit_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, []);

  const handleResponse = useCallback(async (response: Response): Promise<any> => {
    if (response.status === 401) {
      logout();
      throw new ApiError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED');
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}`;
      throw new ApiError(errorMessage, response.status, data.code);
    }

    return data;
  }, [logout]);

  const makeRequest = useCallback(async (
    method: string,
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${endpoint}`;
      const headers = getHeaders(config?.headers);

      const requestConfig: RequestInit = {
        method,
        headers,
        signal: config?.timeout ? AbortSignal.timeout(config.timeout) : undefined
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      let lastError: any;
      const maxRetries = config?.retries || 0;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, requestConfig);
          return await handleResponse(response);
        } catch (err: any) {
          lastError = err;
          
          if (attempt < maxRetries && err.name !== 'AbortError') {
            await new Promise(resolve => setTimeout(resolve, config?.retryDelay || 1000));
            continue;
          }
          
          throw err;
        }
      }

      throw lastError;
    } catch (err: any) {
      const apiError = err instanceof ApiError ? err : new ApiError(
        err.message || 'Erro de conexão',
        err.status || 500,
        err.code
      );
      
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getHeaders, handleResponse]);

  // Métodos HTTP
  const get = useCallback((endpoint: string, config?: RequestConfig) => 
    makeRequest('GET', endpoint, undefined, config), [makeRequest]);

  const post = useCallback((endpoint: string, data?: any, config?: RequestConfig) => 
    makeRequest('POST', endpoint, data, config), [makeRequest]);

  const put = useCallback((endpoint: string, data?: any, config?: RequestConfig) => 
    makeRequest('PUT', endpoint, data, config), [makeRequest]);

  const patch = useCallback((endpoint: string, data?: any, config?: RequestConfig) => 
    makeRequest('PATCH', endpoint, data, config), [makeRequest]);

  const del = useCallback((endpoint: string, config?: RequestConfig) => 
    makeRequest('DELETE', endpoint, undefined, config), [makeRequest]);

  // Upload de arquivos
  const upload = useCallback(async (endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('matchit_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      return await handleResponse(response);
    } catch (err: any) {
      const apiError = new ApiError(err.message || 'Erro no upload', err.status || 500);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, handleResponse]);

  return {
    // Estados
    loading,
    error,
    
    // Métodos HTTP
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    
    // Utilitários
    clearError: () => setError(null),
    isLoading: loading
  };
};

// Classe de erro personalizada
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
