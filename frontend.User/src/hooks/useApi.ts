// src/hooks/useApi.ts - Hook corrigido com debug de autenticação
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

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const useApi = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getHeaders = useCallback((customHeaders?: Record<string, string>): Record<string, string> => {
    // 🔍 DEBUG: Verificar como está obtendo o token
    const token = localStorage.getItem('matchit_token');
    
    console.log('🔍 [useApi] Debug de autenticação:');
    console.log('   Token no localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('   Usuário logado:', user ? user.email : 'null');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (token) {
      // 🔧 CORREÇÃO: Garantir formato correto do header
      headers.Authorization = `Bearer ${token}`;
      console.log('   Authorization header:', headers.Authorization.substring(0, 30) + '...');
    } else {
      console.log('   ❌ Nenhum token encontrado - requisição sem autenticação');
    }

    return headers;
  }, [user]);

  const handleResponse = useCallback(async (response: Response): Promise<any> => {
    console.log(`🔍 [useApi] Response: ${response.status} ${response.statusText}`);
    
    // 🔧 CORREÇÃO: Melhor handling de erro 401
    if (response.status === 401) {
      console.log('❌ [useApi] 401 Unauthorized - fazendo logout');
      logout();
      throw new ApiError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED');
    }

    // 🔧 CORREÇÃO: Melhor handling de erro 403
    if (response.status === 403) {
      console.log('❌ [useApi] 403 Forbidden - acesso negado');
      throw new ApiError('Acesso negado', 403, 'FORBIDDEN');
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('🔍 [useApi] Response data:', data);
    } else {
      data = await response.text();
      console.log('🔍 [useApi] Response text:', data.substring(0, 100));
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}`;
      console.log('❌ [useApi] Erro na resposta:', errorMessage);
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

      console.log(`🚀 [useApi] ${method} ${url}`);
      console.log('🔍 [useApi] Headers:', headers);

      const requestConfig: RequestInit = {
        method,
        headers,
        signal: config?.timeout ? AbortSignal.timeout(config.timeout) : undefined
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
        console.log('🔍 [useApi] Body:', requestConfig.body);
      }

      const response = await fetch(url, requestConfig);
      const result = await handleResponse(response);
      
      console.log('✅ [useApi] Sucesso:', result);
      return result;
      
    } catch (err) {
      console.error('💥 [useApi] Erro:', err);
      
      if (err instanceof ApiError) {
        setError(err);
        throw err;
      } else {
        const apiError = new ApiError(
          err instanceof Error ? err.message : 'Erro desconhecido',
          0,
          'NETWORK_ERROR'
        );
        setError(apiError);
        throw apiError;
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getHeaders, handleResponse]);

  // 🔧 CORREÇÃO: Métodos de conveniência com melhor error handling
  const api = {
    get: useCallback((endpoint: string, config?: RequestConfig) => {
      return makeRequest('GET', endpoint, undefined, config);
    }, [makeRequest]),

    post: useCallback((endpoint: string, data?: any, config?: RequestConfig) => {
      return makeRequest('POST', endpoint, data, config);
    }, [makeRequest]),

    put: useCallback((endpoint: string, data?: any, config?: RequestConfig) => {
      return makeRequest('PUT', endpoint, data, config);
    }, [makeRequest]),

    patch: useCallback((endpoint: string, data?: any, config?: RequestConfig) => {
      return makeRequest('PATCH', endpoint, data, config);
    }, [makeRequest]),

    delete: useCallback((endpoint: string, config?: RequestConfig) => {
      return makeRequest('DELETE', endpoint, undefined, config);
    }, [makeRequest])
  };

  // 🔧 CORREÇÃO: Método para verificar se está autenticado
  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('matchit_token');
    const hasUser = !!user;
    
    console.log('🔍 [useApi] Check autenticação:');
    console.log('   Token existe:', !!token);
    console.log('   User existe:', hasUser);
    
    return !!token && hasUser;
  }, [user]);

  // 🔧 CORREÇÃO: Método para debug de autenticação
  const debugAuth = useCallback(() => {
    const token = localStorage.getItem('matchit_token');
    const authData = localStorage.getItem('matchit_auth');
    const userData = localStorage.getItem('matchit_user');
    
    console.log('🔍 [useApi] Debug completo:');
    console.log('   localStorage.matchit_token:', token ? 'exists' : 'null');
    console.log('   localStorage.matchit_auth:', authData);
    console.log('   localStorage.matchit_user:', userData ? 'exists' : 'null');
    console.log('   useAuth.user:', user);
    console.log('   useAuth.isAuthenticated:', !!user);
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      authData,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    };
  }, [user]);

  return {
    api,
    loading,
    error,
    setError,
    makeRequest,
    isAuthenticated,
    debugAuth
  };
};