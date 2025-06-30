# scripts/phase1-integrate-hooks-i18n.sh - Script completo para integração da Fase 1 - Hooks avançados e sistema i18n

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }
log_highlight() { echo -e "${CYAN}[HIGHLIGHT]${NC} $1"; }

echo ""
log_highlight "🚀 FASE 1: INTEGRAÇÃO DE HOOKS AVANÇADOS E SISTEMA I18N"
echo ""

# Parar servidor se estiver rodando
log_step "1. Parando servidores..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
sleep 2

# Backup da estrutura atual
log_step "2. Criando backup da estrutura atual..."
BACKUP_DIR="backup_phase1_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src "$BACKUP_DIR/"
[ -f "package.json" ] && cp "package.json" "$BACKUP_DIR/"
log_success "Backup criado em: $BACKUP_DIR ✓"

# Criar estrutura avançada de hooks
log_step "3. Criando hooks avançados..."

# useAuth.ts - Sistema de autenticação completo
mkdir -p src/hooks
cat > "src/hooks/useAuth.ts" << 'EOF'
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
EOF

# useApi.ts - Cliente API completo
cat > "src/hooks/useApi.ts" << 'EOF'
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
class ApiError extends Error {
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
EOF

# useTournament.ts - Hook de torneios avançado (versão resumida para integração inicial)
cat > "src/hooks/useTournament.ts" << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

export interface TournamentCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageCount: number;
  available: boolean;
  color: string;
  icon: string;
}

export interface TournamentSession {
  id: string;
  userId: number;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentRound: number;
  totalRounds: number;
  progressPercentage: number;
  startedAt: string;
}

export interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
}

export const useTournament = () => {
  const api = useApi();
  const { user } = useAuth();

  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [currentSession, setCurrentSession] = useState<TournamentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/tournament/categories');
      
      // Mock data para desenvolvimento inicial
      const mockCategories: TournamentCategory[] = [
        {
          id: 'cores',
          name: 'cores',
          displayName: 'Cores',
          description: 'Descubra suas cores favoritas',
          imageCount: 16,
          available: true,
          color: '#FF6B6B',
          icon: '🎨'
        },
        {
          id: 'estilos',
          name: 'estilos',
          displayName: 'Estilos',
          description: 'Explore diferentes estilos visuais',
          imageCount: 16,
          available: true,
          color: '#4ECDC4',
          icon: '👗'
        },
        {
          id: 'ambientes',
          name: 'ambientes',
          displayName: 'Ambientes',
          description: 'Escolha seus ambientes ideais',
          imageCount: 16,
          available: true,
          color: '#45B7D1',
          icon: '🏠'
        }
      ];

      setCategories(response?.data?.categories || mockCategories);
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setError('Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Iniciar torneio
  const startTournament = useCallback(async (categoryId: string): Promise<TournamentSession | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/tournament/start', {
        category: categoryId,
        tournamentSize: 16
      });

      if (response?.data?.session) {
        setCurrentSession(response.data.session);
        return response.data.session;
      }

      return null;
    } catch (err: any) {
      setError('Falha ao iniciar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Carregar categorias na inicialização
  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user, loadCategories]);

  return {
    // Estados
    categories,
    currentSession,
    loading,
    error,
    
    // Ações
    loadCategories,
    startTournament,
    setCurrentSession,
    
    // Utilitários
    clearError: () => setError(null)
  };
};
EOF

# Sistema i18n completo
log_step "4. Configurando sistema de tradução i18n..."

# Instalar dependências i18n se não existirem
if ! npm list i18next >/dev/null 2>&1; then
    log_info "Instalando dependências i18n..."
    npm install i18next react-i18next i18next-browser-languagedetector
fi

# i18n.ts - Configuração
cat > "src/i18n.ts" << 'EOF'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Recursos de tradução
const resources = {
  'pt-BR': {
    translation: {
      // Navegação
      nav: {
        profile: 'Perfil',
        style: 'Estilo',
        matches: 'Matches',
        chats: 'Chats',
        shop: 'Shop',
        settings: 'Configurações'
      },
      
      // Login
      login: {
        title: 'MatchIt',
        subtitle: 'Conecte-se além da superfície',
        email: 'E-mail',
        password: 'Senha',
        signIn: 'Entrar',
        signUp: 'Registrar',
        alreadyHaveAccount: 'Já tem uma conta? Entre',
        noAccount: 'Não tem conta? Registre-se',
        authError: 'Erro na autenticação',
        passwordsDontMatch: 'Senhas não coincidem'
      },
      
      // Perfil
      profile: {
        title: 'Meu Perfil',
        editProfile: 'Editar Perfil & Fotos',
        styleProgress: 'Progresso do Perfil de Estilo',
        adjustStyle: 'Ajustar Seu Estilo',
        accountOptions: 'Opções da Conta',
        edit: {
          title: 'Editar Perfil',
          displayName: 'Nome de Exibição',
          city: 'Cidade',
          saveChanges: 'Salvar Alterações'
        }
      },
      
      // Torneios
      tournament: {
        title: 'Torneio de Estilos',
        selectCategory: 'Escolha uma Categoria',
        startTournament: 'Iniciar Torneio',
        round: 'Rodada {{current}} de {{total}}',
        choosePreferred: 'Escolha sua preferência',
        results: 'Resultados do Torneio',
        champion: 'Campeão',
        finalist: 'Finalista',
        playAgain: 'Jogar Novamente',
        categories: {
          cores: 'Cores',
          estilos: 'Estilos',
          ambientes: 'Ambientes'
        }
      },
      
      // Configurações
      settings: {
        title: 'Configurações',
        appearance: 'Aparência',
        darkMode: 'Modo Escuro',
        notifications: 'Notificações',
        account: 'Conta',
        logout: 'Sair',
        privacy: 'Privacidade',
        language: 'Idioma'
      },
      
      // Comum
      common: {
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        cancel: 'Cancelar',
        save: 'Salvar',
        edit: 'Editar',
        delete: 'Excluir',
        confirm: 'Confirmar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        finish: 'Finalizar'
      },
      
      // Shop
      shop: {
        title: 'Shop',
        curatedForYou: 'Curado Para Você',
        exclusiveDrops: 'Drops Exclusivos',
        recommendedProducts: 'Produtos Recomendados',
        buyNow: 'Comprar Agora'
      },
      
      // Matches
      matches: {
        title: 'Seus Matches',
        noMatches: 'Nenhum match ainda',
        compatibility: 'Compatibilidade',
        newMatch: 'Novo Match!'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    lng: 'pt-BR',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
EOF

# Atualizar main.tsx para incluir i18n e AuthProvider
log_step "5. Atualizando main.tsx com i18n e AuthProvider..."

cat > "src/main.tsx" << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import './i18n';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
EOF

# Atualizar App.tsx para usar os novos hooks
log_step "6. Atualizando App.tsx com hooks integrados..."

cat > "src/App.tsx" << 'EOF'
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
import MatchAreaScreen from './screens/MatchAreaScreen';
import ChatScreen from './screens/ChatScreen';
import VendorScreen from './screens/VendorScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNavbar from './components/navigation/BottomNavbar';
import { useAuth } from './hooks/useAuth';
import { APP_ROUTES } from './constants';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { i18n } = useTranslation();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            <Route path={APP_ROUTES.LOGIN} element={<LoginScreen />} />
            <Route
              path={APP_ROUTES.PROFILE}
              element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.STYLE_ADJUSTMENT}
              element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.MATCH_AREA}
              element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.CHAT}
              element={<ProtectedRoute><ChatScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.VENDOR}
              element={<ProtectedRoute><VendorScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.SETTINGS}
              element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? APP_ROUTES.PROFILE : APP_ROUTES.LOGIN} replace />} />
          </Routes>
        </main>
        {isAuthenticated && <BottomNavbar />}
      </div>
    </div>
  );
};

export default App;
EOF

# Atualizar LoginScreen para usar hooks integrados
log_step "7. Atualizando LoginScreen com hooks..."

cat > "src/screens/LoginScreen.tsx" << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import { APP_ROUTES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { SparklesIcon } from '../components/common/Icon';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login, register, isLoggingIn, isRegistering, error, setError } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSignUp && password !== confirmPassword) {
      setError(t('login.passwordsDontMatch'));
      return;
    }

    try {
      if (isSignUp) {
        await register(email, password, email.split('@')[0]);
      } else {
        await login(email, password);
      }
      navigate(APP_ROUTES.PROFILE);
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-200 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-blue mb-4 animate-pulseGlow" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            {t('login.title')}
          </h1>
          <p className="text-gray-400 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <div className="bg-dark-card rounded-2xl p-8 border border-neon-blue/30 shadow-glow-blue">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            {isSignUp && (
              <div>
                <input
                  type="password"
                  placeholder="Confirmar Senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full" 
              glowEffect="blue"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : (isSignUp ? t('login.signUp') : t('login.signIn'))}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-neon-blue hover:text-neon-green transition-colors"
              disabled={isLoading}
            >
              {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
EOF

# Atualizar ProfileScreen para usar useAuth e i18n
log_step "8. Atualizando ProfileScreen..."

cat > "src/screens/ProfileScreen.tsx" << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { APP_ROUTES, NEON_COLORS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const displayName = user?.displayName || 'Alex Ryder';
  const city = user?.city || 'Neo Kyoto';
  const email = user?.email || 'alex@matchit.com';
  const isVip = user?.isVip || true;
  const bio = user?.bio || 'Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.';

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <Card glowColor="blue">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-neon-blue to-neon-green rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-black">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <h1 className="text-2xl font-bold text-neon-blue flex items-center justify-center gap-2">
            {displayName}
            {isVip && <span className="text-neon-orange text-sm">VIP</span>}
          </h1>
          <p className="text-sm text-gray-400">{city} | {email}</p>
          <p className="mt-4 text-sm text-gray-300">{bio}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full" glowEffect="green">
          {t('profile.editProfile')}
        </Button>
      </Card>

      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-2`}>
          {t('profile.styleProgress')}
        </h2>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-neon-blue to-neon-green h-3 rounded-full" style={{width: '65%'}}></div>
        </div>
        <p className="text-sm text-gray-400 text-center">65% {t('profile.styleProgress').toLowerCase()}</p>
        <Button 
          variant="primary" 
          size="md" 
          className="mt-4 w-full" 
          onClick={() => navigate(APP_ROUTES.STYLE_ADJUSTMENT)}
          glowEffect="blue"
        >
          {t('profile.adjustStyle')}
        </Button>
      </Card>

      <Card glowColor="orange">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.orange} mb-3`}>
          {t('profile.accountOptions')}
        </h2>
        <div className="space-y-3">
          <Button variant="outline" glowEffect="blue" className="w-full">
            {t('profile.edit.title')}
          </Button>
          <Button variant="outline" glowEffect="green" className="w-full">
            {t('settings.privacy')}
          </Button>
          <Button variant="outline" glowEffect="orange" className="w-full">
            {t('settings.notifications')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfileScreen;
EOF

# Atualizar SettingsScreen
log_step "9. Atualizando SettingsScreen..."

cat > "src/screens/SettingsScreen.tsx" << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CogIcon } from '../components/common/Icon';
import { useAuth } from '../hooks/useAuth';
import { APP_ROUTES, NEON_COLORS } from '../constants';

const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate(APP_ROUTES.LOGIN);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <div className="text-center mb-6">
        <CogIcon className={`w-12 h-12 mx-auto ${NEON_COLORS.blue} mb-2`} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
          {t('settings.title')}
        </h1>
      </div>

      <Card glowColor="blue">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.blue} mb-3`}>
          {t('settings.account')}
        </h2>
        <div className="space-y-3">
          <Button variant="outline" glowEffect="blue" className="w-full">
            {t('profile.edit.title')}
          </Button>
          <Button variant="outline" glowEffect="green" className="w-full">
            {t('settings.privacy')}
          </Button>
          <Button variant="outline" glowEffect="orange" className="w-full">
            {t('settings.notifications')}
          </Button>
          <Button variant="secondary" glowEffect="orange" className="w-full" onClick={handleLogout}>
            {t('settings.logout')}
          </Button>
        </div>
      </Card>

      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-3`}>
          {t('settings.appearance')}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>{t('settings.darkMode')}</span>
            <div className="w-12 h-6 bg-neon-blue rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
          <Button variant="outline" glowEffect="green" className="w-full">
            {t('settings.language')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsScreen;
EOF

# Limpar cache e testar
log_step "10. Limpando cache e testando..."
rm -rf node_modules/.vite .vite dist

# Testar build
log_step "11. Testando build..."
if npm run build; then
    log_success "✅ FASE 1 CONCLUÍDA COM SUCESSO!"
    echo ""
    log_highlight "🎉 INTEGRAÇÃO COMPLETA REALIZADA!"
    echo ""
    log_info "📋 O QUE FOI INTEGRADO:"
    log_info "✓ useAuth - Sistema de autenticação avançado"
    log_info "✓ useApi - Cliente API completo com error handling"
    log_info "✓ useTournament - Hook de torneios (base integrada)"
    log_info "✓ i18n - Sistema de tradução PT-BR completo"
    log_info "✓ AuthProvider - Context de autenticação"
    log_info "✓ Telas atualizadas - Login, Profile, Settings com i18n"
    log_info "✓ Design cyberpunk - Mantido e melhorado"
    echo ""
    log_info "🚀 PRÓXIMOS PASSOS:"
    log_info "1. Execute: npm run dev"
    log_info "2. Teste o login (qualquer email/senha)"
    log_info "3. Navegue pelas telas traduzidas"
    log_info "4. Prepare-se para a Fase 2 (Sistema de Torneios)"
    echo ""
    log_success "🎯 RESULTADO: Aplicação com hooks avançados e tradução PT-BR funcionando!"
    echo ""
else
    log_error "❌ Build falhou. Verifique os erros acima."
    log_info "💡 Tente executar 'npm run dev' mesmo assim para testar as funcionalidades"
fi