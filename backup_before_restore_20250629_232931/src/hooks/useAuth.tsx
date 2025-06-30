// hooks/useAuth.ts - Hook de autenticação atualizado
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  isAdmin?: boolean;
  profilePicture?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Carregar dados de autenticação salvos
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('userData')
      ]);

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Verificar se token ainda é válido
        const isValid = await validateToken(storedToken);
        
        if (isValid) {
          setToken(storedToken);
          setUser(userData);
        } else {
          // Token inválido, limpar dados
          await clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  };

  const saveAuthData = async (authToken: string, userData: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('authToken', authToken),
        AsyncStorage.setItem('userData', JSON.stringify(userData))
      ]);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('userData')
      ]);
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha no login');
      }

      if (!data.success) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      const { token: authToken, user: userData } = data;

      // Salvar dados
      await saveAuthData(authToken, userData);
      
      // Atualizar estado
      setToken(authToken);
      setUser(userData);

    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha no registro');
      }

      if (!data.success) {
        throw new Error(data.message || 'Falha ao criar conta');
      }

      const { token: authToken, user: newUser } = data;

      // Salvar dados
      await saveAuthData(authToken, newUser);
      
      // Atualizar estado
      setToken(authToken);
      setUser(newUser);

    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Limpar dados locais
      await clearStoredAuth();
      
      // Limpar estado
      setToken(null);
      setUser(null);

      // Opcional: notificar servidor sobre logout
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          // Ignorar erros de logout no servidor
          console.error('Erro ao notificar logout no servidor:', error);
        }
      }

    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Salvar dados atualizados
      if (token) {
        saveAuthData(token, updatedUser);
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// hooks/useApi.ts - Hook de API atualizado com interceptors
import { useAuth } from './useAuth';
import { useCallback } from 'react';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export const useApi = () => {
  const { token, logout } = useAuth();
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const DEFAULT_TIMEOUT = 30000; // 30 segundos

  const makeRequest = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit & ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const { headers = {}, timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    
    // Preparar headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Adicionar token de autenticação se disponível
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Configurar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Verificar se é erro de autenticação
      if (response.status === 401) {
        // Token expirado ou inválido
        await logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Tentar parsear resposta como JSON
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite de requisição excedido');
      }
      
      console.error(`API Error [${fetchOptions.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }, [token, logout]);

  const get = useCallback(<T = any>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    return makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }, [makeRequest]);

  const post = useCallback(<T = any>(
    endpoint: string,
    data?: any,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const body = data ? JSON.stringify(data) : undefined;
    return makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }, [makeRequest]);

  const put = useCallback(<T = any>(
    endpoint: string,
    data?: any,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const body = data ? JSON.stringify(data) : undefined;
    return makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }, [makeRequest]);

  const del = useCallback(<T = any>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    return makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }, [makeRequest]);

  const patch = useCallback(<T = any>(
    endpoint: string,
    data?: any,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const body = data ? JSON.stringify(data) : undefined;
    return makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }, [makeRequest]);

  // Método especial para upload de arquivos
  const upload = useCallback(<T = any>(
    endpoint: string,
    formData: FormData,
    options: Omit<ApiOptions, 'headers'> = {}
  ): Promise<ApiResponse<T>> => {
    // Para FormData, não definir Content-Type (deixar o browser definir)
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  }, [makeRequest, token]);

  return {
    get,
    post,
    put,
    delete: del,
    patch,
    upload,
    makeRequest
  };
};

export default useApi;