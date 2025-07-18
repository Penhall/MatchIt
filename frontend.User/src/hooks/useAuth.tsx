import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string; // MODIFICADO: de number para string para suportar UUID
  name: string;
  email: string;
  displayName: string;
  city: string;
  gender: 'male' | 'female' | 'other';
  avatarUrl?: string;
  bio?: string;
  isVip: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('matchit_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('matchit_auth') === 'true' && user !== null;
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('matchit_token');
    const auth = localStorage.getItem('matchit_auth');
    
    if (auth === 'true' && token && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoggingIn(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      
      // MODIFICADO: Usar o usuário real da API em vez de um mock
      const realUser: User = data.user;

      localStorage.setItem('matchit_token', data.token);
      localStorage.setItem('matchit_user', JSON.stringify(realUser));
      localStorage.setItem('matchit_auth', 'true');
      
      setUser(realUser);
      setIsAuthenticated(true);
      
    } catch (err: any) {
      setError(err.message || 'Erro no login');
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    try {
      setIsRegistering(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no registro');
      }

      await login(email, password);
      
    } catch (err: any) {
      setError(err.message || 'Erro no registro');
      throw err;
    } finally {
      setIsRegistering(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('matchit_token');
    localStorage.removeItem('matchit_user');
    localStorage.setItem('matchit_auth', 'false');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('matchit_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoggingIn,
    isRegistering,
    error,
    login,
    register,
    logout,
    updateUser,
    setError,
    clearError
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
