import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface User {
  id: number;
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
    return localStorage.getItem('matchit_auth') === 'true' && !!localStorage.getItem('matchit_token');
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem('matchit_auth', String(isAuthenticated));
    if (user) {
      localStorage.setItem('matchit_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('matchit_user');
    }
  }, [isAuthenticated, user]);

  // Verificar token na inicialização
  useEffect(() => {
    const token = localStorage.getItem('matchit_token');
    const savedUser = localStorage.getItem('matchit_user');
    
    if (token && savedUser && !user) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Erro ao restaurar usuário:', err);
        logout();
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoggingIn(true);
      setError(null);

      // Simular chamada de API (substituir por API real)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }

      const data = await response.json();
      
      // Simular usuário para desenvolvimento
      const mockUser: User = {
        id: 1,
        name: 'Alex Ryder',
        email: email,
        displayName: 'Alex Ryder',
        city: 'Neo Kyoto',
        gender: 'male',
        avatarUrl: 'https://picsum.photos/seed/alexryder/200/200',
        bio: 'Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.',
        isVip: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      localStorage.setItem('matchit_token', data.token || 'demo-token');
      setUser(mockUser);
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

      // Simular registro (substituir por API real)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (!response.ok) {
        throw new Error('Erro no registro');
      }

      // Após registro bem-sucedido, fazer login automaticamente
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
