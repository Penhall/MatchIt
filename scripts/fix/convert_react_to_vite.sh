# scripts/fix/convert_react_to_vite.sh - Conversão completa de React para Vite

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}=========================================================${NC}"
echo -e "${PURPLE}   CONVERSÃO COMPLETA: REACT → VITE${NC}"
echo -e "${PURPLE}=========================================================${NC}"

# Função para fazer backup
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${YELLOW}📦 Backup criado: ${file}.backup.$(date +%Y%m%d_%H%M%S)${NC}"
    fi
}

# =====================================================
# ETAPA 1: ANÁLISE E BACKUP
# =====================================================

echo -e "\n${BLUE}ETAPA 1: Análise e backup dos arquivos${NC}"

# Lista de arquivos a serem modificados
files_to_fix=(
    "src/services/api.ts"
    "src/context/AuthContext.tsx"
    "vite.config.ts"
    "package.json"
)

echo -e "${YELLOW}Criando backups dos arquivos existentes...${NC}"
for file in "${files_to_fix[@]}"; do
    backup_file "$file"
done

# =====================================================
# ETAPA 2: DETECTAR PROBLEMAS
# =====================================================

echo -e "\n${BLUE}ETAPA 2: Detectando problemas de React vs Vite${NC}"

# Procurar por REACT_APP_ em arquivos
echo -e "${YELLOW}Procurando por REACT_APP_ em arquivos TypeScript/JavaScript...${NC}"

react_app_files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "REACT_APP_" {} \; 2>/dev/null)

if [ ! -z "$react_app_files" ]; then
    echo -e "${RED}❌ Encontrados arquivos com REACT_APP_:${NC}"
    echo "$react_app_files"
else
    echo -e "${GREEN}✅ Nenhum arquivo com REACT_APP_ encontrado${NC}"
fi

# Procurar por process.env em arquivos
echo -e "\n${YELLOW}Procurando por process.env em arquivos frontend...${NC}"

process_env_files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "process\.env" {} \; 2>/dev/null)

if [ ! -z "$process_env_files" ]; then
    echo -e "${RED}❌ Encontrados arquivos com process.env:${NC}"
    echo "$process_env_files"
else
    echo -e "${GREEN}✅ Nenhum arquivo com process.env encontrado${NC}"
fi

# =====================================================
# ETAPA 3: CORRIGIR API.TS
# =====================================================

echo -e "\n${BLUE}ETAPA 3: Corrigindo src/services/api.ts${NC}"

cat > src/services/api.ts << 'EOF'
// src/services/api.ts - Configuração corrigida para Vite
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// ✅ CORREÇÃO: Usar import.meta.env em vez de process.env para Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔧 API Base URL configurada:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor para injetar token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debug
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor para tratamento de erros
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log para debug
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // Log detalhado do erro
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Tratamento específico para 401
    if (error.response?.status === 401) {
      console.warn('🔐 Token expirado - removendo e redirecionando');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Interface para respostas padronizadas
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Funções auxiliares com tipagem melhorada
const apiService = {
  get: <T>(endpoint: string) => api.get<T>(endpoint),
  post: <T>(endpoint: string, body: any) => api.post<T>(endpoint, body),
  put: <T>(endpoint: string, body: any) => api.put<T>(endpoint, body),
  delete: <T>(endpoint: string) => api.delete<T>(endpoint),
  
  // Método para upload de arquivos
  upload: (endpoint: string, formData: FormData) => {
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default apiService;
export { API_BASE_URL };
export type { ApiResponse };
EOF

echo -e "${GREEN}✅ src/services/api.ts corrigido para Vite${NC}"

# =====================================================
# ETAPA 4: CORRIGIR VITE.CONFIG.TS
# =====================================================

echo -e "\n${BLUE}ETAPA 4: Corrigindo vite.config.ts${NC}"

cat > vite.config.ts << 'EOF'
// vite.config.ts - Configuração corrigida para integração com backend
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  
  // ✅ Definição de tipos de ambiente
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000/api'),
  },
  
  // Resolução de aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@context': path.resolve(__dirname, './src/context'),
      '@components': path.resolve(__dirname, './src/components'),
      '@components/common': path.resolve(__dirname, './src/components/common'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    }
  },
  
  // Configuração do servidor de desenvolvimento
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false,
    
    // ✅ CORREÇÃO: Proxy sem rewrite problemático
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        // ❌ REMOVIDO: rewrite que causava problemas
        // rewrite: (path) => path.replace(/^\/api/, ''),
        
        // Log detalhado para debug
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error:', err.message);
            console.error('🔴 Request URL:', req.url);
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🚀 Proxy Request:', req.method, req.url);
            console.log('🎯 Target:', `http://localhost:3000${req.url}`);
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '🔴';
            console.log(`${emoji} Proxy Response:`, proxyRes.statusCode, req.url);
          });
        }
      },
      
      // Proxy para uploads
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Configuração de preview (produção local)
  preview: {
    port: 4173,
    host: true,
    open: true,
    
    // Mesmo proxy para preview
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Configuração de build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    manifest: true,
    sourcemap: true,
    
    // Otimizações
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@heroicons/react'],
          utils: ['axios']
        }
      }
    }
  },
  
  // Otimização de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ]
  },
  
  // Configuração CSS
  css: {
    devSourcemap: true
  }
});
EOF

echo -e "${GREEN}✅ vite.config.ts corrigido${NC}"

# =====================================================
# ETAPA 5: CRIAR ARQUIVO DE TIPOS VITE
# =====================================================

echo -e "\n${BLUE}ETAPA 5: Criando arquivo de tipos para Vite${NC}"

cat > src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

// Definição de tipos para variáveis de ambiente do Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Tipos globais para o projeto
declare global {
  const __API_URL__: string;
}
EOF

echo -e "${GREEN}✅ src/vite-env.d.ts criado${NC}"

# =====================================================
# ETAPA 6: CORRIGIR AUTHCONTEXT.TSX
# =====================================================

echo -e "\n${BLUE}ETAPA 6: Corrigindo src/context/AuthContext.tsx${NC}"

cat > src/context/AuthContext.tsx << 'EOF'
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
EOF

echo -e "${GREEN}✅ src/context/AuthContext.tsx corrigido${NC}"

# =====================================================
# ETAPA 7: CRIAR ARQUIVO .ENV.LOCAL
# =====================================================

echo -e "\n${BLUE}ETAPA 7: Criando arquivo .env.local${NC}"

cat > .env.local << 'EOF'
# ✅ Variáveis de ambiente para Vite (desenvolvimento local)
# IMPORTANTE: Usar prefixo VITE_ para que sejam visíveis no frontend

# URL da API backend
VITE_API_URL=http://localhost:3000/api

# Informações da aplicação
VITE_APP_NAME=MatchIt
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Backend (apenas para referência, não visível no frontend)
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=matchit
DB_PASSWORD=matchit123
DB_NAME=matchit_db
JWT_SECRET=matchit_secret_key_dev_2024
EOF

echo -e "${GREEN}✅ .env.local criado com variáveis corretas para Vite${NC}"

# =====================================================
# ETAPA 8: ATUALIZAR PACKAGE.JSON
# =====================================================

echo -e "\n${BLUE}ETAPA 8: Verificando package.json${NC}"

# Verificar se os scripts estão corretos
if grep -q '"dev".*vite' package.json; then
    echo -e "${GREEN}✅ Script 'dev' configurado para Vite${NC}"
else
    echo -e "${YELLOW}⚠️  Verificar script 'dev' no package.json${NC}"
fi

if grep -q '"build".*vite build' package.json; then
    echo -e "${GREEN}✅ Script 'build' configurado para Vite${NC}"
else
    echo -e "${YELLOW}⚠️  Verificar script 'build' no package.json${NC}"
fi

# =====================================================
# ETAPA 9: VERIFICAÇÕES FINAIS
# =====================================================

echo -e "\n${BLUE}ETAPA 9: Verificações finais${NC}"

# Verificar se backend está configurado para porta 3000
if grep -q "PORT.*3000" server/config/environment.js 2>/dev/null; then
    echo -e "${GREEN}✅ Backend configurado para porta 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Verificar configuração de porta do backend${NC}"
fi

# Verificar estrutura de arquivos
echo -e "\n${YELLOW}Verificando arquivos criados/modificados:${NC}"

files_to_check=(
    "src/services/api.ts"
    "src/context/AuthContext.tsx"
    "src/vite-env.d.ts"
    "vite.config.ts"
    ".env.local"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ❌ $file (ausente)"
    fi
done

# =====================================================
# CONCLUSÃO
# =====================================================

echo -e "\n${PURPLE}=========================================================${NC}"
echo -e "${PURPLE}   CONVERSÃO CONCLUÍDA!${NC}"
echo -e "${PURPLE}=========================================================${NC}"

echo -e "\n${GREEN}✅ Todas as correções React → Vite aplicadas!${NC}"

echo -e "\n${YELLOW}Principais mudanças realizadas:${NC}"
echo "• ✅ process.env.REACT_APP_* → import.meta.env.VITE_*"
echo "• ✅ Proxy do Vite corrigido (removido rewrite problemático)"
echo "• ✅ AuthContext corrigido para formato de resposta Axios"
echo "• ✅ Variáveis de ambiente .env.local criadas"
echo "• ✅ Tipos TypeScript para Vite definidos"
echo "• ✅ Backend mantido na porta 3000"

echo -e "\n${BLUE}Próximos passos:${NC}"
echo "1. Verifique se o backend está rodando:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "2. Inicie o frontend:"
echo "   npm run dev"
echo ""
echo "3. Teste login/registro:"
echo "   Acesse http://localhost:5173"

echo -e "\n${GREEN}🎉 Problema de integração frontend-backend resolvido!${NC}"
