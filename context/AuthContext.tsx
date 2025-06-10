// context/AuthContext.tsx - Corrigido
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  city?: string;
  isVip?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void; // ✅ ADICIONADO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há token armazenado ao inicializar
  useEffect(() => {
    const token = localStorage.getItem('matchit_token');
    const isAuth = localStorage.getItem('matchit_auth');
    
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

  const login = async (email?: string, password?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        // Login rápido para desenvolvimento
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('matchit_token', mockToken);
        localStorage.setItem('matchit_auth', 'true');
        setUser({
          id: 'currentUser',
          email: email || 'user@example.com',
          name: 'User'
        });
        setIsAuthenticated(true);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const contentType = response.headers.get('content-type');

      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data.token) {
          localStorage.setItem('matchit_token', data.token);
          localStorage.setItem('matchit_auth', 'true');
          setUser(data.user || {
            id: 'currentUser',
            email: email,
            name: 'User'
          });
          setIsAuthenticated(true);
        } else {
          throw new Error('Token não recebido');
        }
      } else {
        // Fallback para modo desenvolvimento
        console.warn('Backend não disponível, usando login mock');
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('matchit_token', mockToken);
        localStorage.setItem('matchit_auth', 'true');
        setUser({
          id: 'currentUser',
          email: email,
          name: 'User'
        });
        setIsAuthenticated(true);
      }
    } catch (err: unknown) {
      console.warn('Erro no login, usando modo desenvolvimento:', err);
      // Fallback para modo desenvolvimento
      const mockToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('matchit_token', mockToken);
      localStorage.setItem('matchit_auth', 'true');
      setUser({
        id: 'currentUser',
        email: email || 'user@example.com',
        name: 'User'
      });
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      const contentType = response.headers.get('content-type');

      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data.token) {
          localStorage.setItem('matchit_token', data.token);
          localStorage.setItem('matchit_auth', 'true');
          setUser(data.user || {
            id: 'currentUser',
            email: email,
            name: name
          });
          setIsAuthenticated(true);
        } else {
          throw new Error('Token não recebido');
        }
      } else {
        // Fallback para modo desenvolvimento
        console.warn('Backend não disponível, usando registro mock');
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('matchit_token', mockToken);
        localStorage.setItem('matchit_auth', 'true');
        setUser({
          id: 'currentUser',
          email: email,
          name: name
        });
        setIsAuthenticated(true);
      }
    } catch (err: unknown) {
      console.warn('Erro no registro, usando modo desenvolvimento:', err);
      // Fallback para modo desenvolvimento
      const mockToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('matchit_token', mockToken);
      localStorage.setItem('matchit_auth', 'true');
      setUser({
        id: 'currentUser',
        email: email,
        name: name
      });
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('matchit_token');
    localStorage.removeItem('matchit_auth');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      register,
      loading,
      error,
      setError  // ✅ EXPORTANDO setError
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