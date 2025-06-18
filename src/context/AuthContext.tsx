// context/AuthContext.tsx - Corrigido
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  city?: string;
  isVip?: boolean;
  bio?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  loading: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  setUserState: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há token armazenado ao inicializar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const isAuth = localStorage.getItem('auth_token') ? 'true' : null;
    
    if (token && isAuth === 'true') {
      setIsAuthenticated(true);
      // Aqui você pode validar o token com o backend se necessário
      setUser({
        id: 'currentUser',
        email: 'user@example.com',
        name: 'User'
      });
    }
  }, []);

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar perfil');
      }

      const updatedUser = await response.json();
      setUser(prev => ({ ...prev, ...updatedUser }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setIsLoggingIn(true);
      setError(null);

      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      const response = await api.post<{auth_token: string, user: User}>('/auth/login', { email, password });

      if (response.success && response.data?.auth_token) {
        localStorage.setItem('auth_token', response.data.auth_token);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        const errorMessage = response.error?.message || 'Falha no login';
        if (response.error?.code === 'INVALID_CREDENTIALS') {
          throw new Error('Credenciais inválidas');
        }
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setIsRegistering(true);
      setError(null);

      if (!email || !password || !name) {
        throw new Error('Email, senha e nome são obrigatórios');
      }

      const response = await api.post<{auth_token: string, user: User}>('/auth/register', { email, password, name });

      if (response.success && response.data?.auth_token) {
        localStorage.setItem('auth_token', response.data.auth_token);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        const errorMessage = response.error?.message || 'Falha no registro';
        if (response.error?.code === 'EMAIL_EXISTS') {
          throw new Error('Email já cadastrado');
        }
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
      setIsRegistering(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const setUserState = (user: User | null) => {
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      register,
      updateProfile,
      loading,
      isLoggingIn,
      isRegistering,
      error,
      setError,
      setUserState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
