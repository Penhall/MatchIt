// src/context/AuthContext.tsx - Corrigido para funcionar com backend
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
    
    if (token) {
      setIsAuthenticated(true);
      // Tentar buscar dados do usuário se necessário
      // validateToken();
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await api.get('/auth/validate');
      if (response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
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

      console.log('🔐 Tentando fazer login...');
      
      // ✅ CORREÇÃO: Usar resposta Axios padrão, não formato customizado
      const response = await api.post('/auth/login', { email, password });

      console.log('✅ Resposta do login:', response.data);

      // ✅ CORREÇÃO: Acessar dados diretamente do response.data
      if (response.data && response.data.auth_token) {
        localStorage.setItem('auth_token', response.data.auth_token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('✅ Login realizado com sucesso');
      } else {
        throw new Error('Resposta de login inválida');
      }
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      
      // Mapear erros específicos
      let message = 'Erro desconhecido';
      
      if (err.response?.status === 400) {
        message = 'Credenciais inválidas';
      } else if (err.response?.status === 500) {
        message = 'Erro interno do servidor';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      throw new Error(message);
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

      console.log('📝 Tentando fazer registro...');

      // ✅ CORREÇÃO: Usar resposta Axios padrão
      const response = await api.post('/auth/register', { email, password, name });

      console.log('✅ Resposta do registro:', response.data);

      // ✅ CORREÇÃO: Acessar dados diretamente do response.data
      if (response.data && response.data.auth_token) {
        localStorage.setItem('auth_token', response.data.auth_token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('✅ Registro realizado com sucesso');
      } else {
        throw new Error('Resposta de registro inválida');
      }
    } catch (err: any) {
      console.error('❌ Erro no registro:', err);
      
      // Mapear erros específicos
      let message = 'Erro desconhecido';
      
      if (err.response?.status === 400) {
        message = 'Dados inválidos';
      } else if (err.response?.status === 409) {
        message = 'Email já cadastrado';
      } else if (err.response?.status === 500) {
        message = 'Erro interno do servidor';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
      setIsRegistering(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put('/profile', profileData);

      if (response.data) {
        setUser(prev => ({ ...prev, ...response.data }));
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao atualizar perfil';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    console.log('👋 Logout realizado');
  };

  const setUserState = (user: User | null) => {
    setUser(user);
  };

  const contextValue: AuthContextType = {
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
    setUserState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

export default AuthContext;