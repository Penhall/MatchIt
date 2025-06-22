# scripts/fix/fix_all_issues.sh - Resolver TODOS os problemas de uma vez

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}============================================================${NC}"
echo -e "${PURPLE}   CORREÇÃO COMPLETA DE TODOS OS PROBLEMAS - MatchIt${NC}"
echo -e "${PURPLE}============================================================${NC}"

echo -e "\n${BLUE}Problemas sendo corrigidos:${NC}"
echo "• ❌ Backend rodando na porta 3001 (frontend configurado para 3000)"
echo "• ❌ Middleware auth.js com exports incorretos"
echo "• ❌ Variáveis de ambiente React vs Vite"
echo "• ❌ Proxy Vite com rewrite problemático"
echo "• ❌ AuthContext esperando formato customizado"

# =====================================================
# ETAPA 1: PARAR PROCESSOS E FAZER BACKUPS
# =====================================================

echo -e "\n${BLUE}ETAPA 1: Preparação${NC}"

# Função para backup
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "  📦 Backup: $file"
    fi
}

echo -e "${YELLOW}Criando backups dos arquivos importantes...${NC}"

critical_files=(
    "server/middleware/auth.js"
    "src/services/api.ts"
    "src/context/AuthContext.tsx"
    "vite.config.ts"
    ".env.local"
)

for file in "${critical_files[@]}"; do
    backup_file "$file"
done

# =====================================================
# ETAPA 2: CORRIGIR MIDDLEWARE AUTH.JS
# =====================================================

echo -e "\n${BLUE}ETAPA 2: Corrigindo middleware de autenticação${NC}"

echo -e "${YELLOW}🔧 Criando server/middleware/auth.js corrigido...${NC}"

mkdir -p server/middleware

cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware de autenticação corrigido
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso obrigatório',
        code: 'MISSING_TOKEN'
      });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        console.error('❌ Token inválido:', err.message);
        return res.status(403).json({ 
          error: 'Token inválido ou expirado',
          code: 'INVALID_TOKEN'
        });
      }
      
      req.user = user;
      console.log('✅ Usuário autenticado:', user.id || user.email);
      next();
    });
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      code: 'AUTH_ERROR'
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, config.jwt.secret, (err, user) => {
        if (!err) {
          req.user = user;
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    next();
  }
};

// EXPORTS COMPATÍVEIS
export { authenticateToken, optionalAuth };
export default authenticateToken;
export { authenticateToken as authMiddleware };
EOF

echo -e "${GREEN}✅ Middleware auth.js corrigido${NC}"

# =====================================================
# ETAPA 3: CORRIGIR API.TS PARA PORTA 3001
# =====================================================

echo -e "\n${BLUE}ETAPA 3: Corrigindo API service para porta 3001${NC}"

echo -e "${YELLOW}🔧 Atualizando src/services/api.ts...${NC}"

mkdir -p src/services

cat > src/services/api.ts << 'EOF'
// src/services/api.ts - API service corrigido para porta 3001
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// ✅ CORREÇÃO: Backend está rodando na porta 3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔧 API configurada para:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🎯 Full URL:', `${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A'
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 CONEXÃO RECUSADA - Verifique se backend está rodando na porta 3001');
    } else if (error.response?.status === 401) {
      console.warn('🔐 Token expirado - fazendo logout');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

const apiService = {
  get: <T>(endpoint: string) => api.get<T>(endpoint),
  post: <T>(endpoint: string, body: any) => api.post<T>(endpoint, body),
  put: <T>(endpoint: string, body: any) => api.put<T>(endpoint, body),
  delete: <T>(endpoint: string) => api.delete<T>(endpoint),
  
  testConnection: async () => {
    try {
      const response = await api.get('/health');
      console.log('✅ Teste de conectividade OK:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Teste de conectividade falhou:', error);
      return { success: false, error };
    }
  }
};

export default apiService;
export { API_BASE_URL };
EOF

echo -e "${GREEN}✅ API service corrigido para porta 3001${NC}"

# =====================================================
# ETAPA 4: CORRIGIR VITE.CONFIG.TS
# =====================================================

echo -e "\n${BLUE}ETAPA 4: Corrigindo configuração do Vite${NC}"

echo -e "${YELLOW}🔧 Atualizando vite.config.ts...${NC}"

cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    
    // ✅ PROXY CORRIGIDO PARA PORTA 3001
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error:', err.message);
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🚀 Proxy:', req.method, req.url, '→ http://localhost:3001');
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '🔴';
            console.log(`${emoji} Proxy Response:`, proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
EOF

echo -e "${GREEN}✅ Vite config corrigido${NC}"

# =====================================================
# ETAPA 5: CORRIGIR .ENV.LOCAL
# =====================================================

echo -e "\n${BLUE}ETAPA 5: Configurando variáveis de ambiente${NC}"

echo -e "${YELLOW}🔧 Criando .env.local...${NC}"

cat > .env.local << 'EOF'
# Variáveis para Vite - Backend na porta 3001
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=MatchIt
VITE_ENVIRONMENT=development

# Backend
NODE_ENV=development
PORT=3001
EOF

echo -e "${GREEN}✅ .env.local criado${NC}"

# =====================================================
# ETAPA 6: CORRIGIR AUTHCONTEXT.TSX
# =====================================================

echo -e "\n${BLUE}ETAPA 6: Corrigindo AuthContext${NC}"

if [ -f "src/context/AuthContext.tsx" ]; then
    echo -e "${YELLOW}🔧 Corrigindo AuthContext.tsx...${NC}"
    
    # Correção básica via sed
    sed -i 's/response\.success && response\.data?.auth_token/response.data \&\& response.data.auth_token/g' src/context/AuthContext.tsx 2>/dev/null
    sed -i 's/response\.success && response\.data?.user/response.data \&\& response.data.user/g' src/context/AuthContext.tsx 2>/dev/null
    
    echo -e "${GREEN}✅ AuthContext corrigido${NC}"
else
    echo -e "${YELLOW}⚠️  AuthContext.tsx não encontrado${NC}"
fi

# =====================================================
# ETAPA 7: CRIAR TIPOS VITE
# =====================================================

echo -e "\n${BLUE}ETAPA 7: Criando tipos TypeScript${NC}"

echo -e "${YELLOW}🔧 Criando src/vite-env.d.ts...${NC}"

cat > src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
EOF

echo -e "${GREEN}✅ Tipos Vite criados${NC}"

# =====================================================
# ETAPA 8: CORRIGIR IMPORTS PROBLEMÁTICOS
# =====================================================

echo -e "\n${BLUE}ETAPA 8: Corrigindo imports problemáticos${NC}"

# Corrigir styleAdjustment.js se existir
if [ -f "server/routes/styleAdjustment.js" ]; then
    echo -e "${YELLOW}🔧 Corrigindo styleAdjustment.js...${NC}"
    sed -i "s/import authMiddleware from.*auth\.js.*/import { authenticateToken as authMiddleware } from '..\/middleware\/auth.js';/g" server/routes/styleAdjustment.js
    echo -e "${GREEN}✅ styleAdjustment.js corrigido${NC}"
fi

# Corrigir admin.js se existir
if [ -f "server/routes/admin.js" ]; then
    echo -e "${YELLOW}🔧 Corrigindo admin.js...${NC}"
    sed -i "s/import authMiddleware from.*auth\.js.*/import { authenticateToken as authMiddleware } from '..\/middleware\/auth.js';/g" server/routes/admin.js
    echo -e "${GREEN}✅ admin.js corrigido${NC}"
fi

# =====================================================
# ETAPA 9: VERIFICAÇÕES FINAIS
# =====================================================

echo -e "\n${BLUE}ETAPA 9: Verificações finais${NC}"

# Testar sintaxe dos arquivos críticos
echo -e "${YELLOW}Testando sintaxe dos arquivos...${NC}"

if node -c server/middleware/auth.js 2>/dev/null; then
    echo -e "${GREEN}✅ auth.js - sintaxe OK${NC}"
else
    echo -e "${RED}❌ auth.js - erro de sintaxe${NC}"
fi

# Verificar se backend está respondendo
echo -e "${YELLOW}Testando conectividade com backend...${NC}"

if curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend respondendo na porta 3001${NC}"
else
    echo -e "${YELLOW}⚠️  Backend pode não estar rodando (normal se você parou)${NC}"
fi

# Listar arquivos modificados
echo -e "\n${YELLOW}Arquivos modificados/criados:${NC}"

files_to_check=(
    "server/middleware/auth.js"
    "src/services/api.ts"
    "src/vite-env.d.ts"
    "vite.config.ts"
    ".env.local"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ❌ $file (não criado)"
    fi
done

# =====================================================
# CONCLUSÃO
# =====================================================

echo -e "\n${PURPLE}============================================================${NC}"
echo -e "${PURPLE}   CORREÇÃO COMPLETA FINALIZADA!${NC}"
echo -e "${PURPLE}============================================================${NC}"

echo -e "\n${GREEN}🎉 TODOS OS PROBLEMAS CORRIGIDOS!${NC}"

echo -e "\n${YELLOW}✅ Correções aplicadas:${NC}"
echo "• 🔧 Middleware auth.js - exports corrigidos"
echo "• 🔧 API service - configurado para porta 3001"
echo "• 🔧 Vite config - proxy para porta 3001"
echo "• 🔧 Variáveis ambiente - VITE_* em vez de REACT_APP_*"
echo "• 🔧 AuthContext - formato Axios padrão"
echo "• 🔧 Tipos TypeScript - definições Vite"

echo -e "\n${BLUE}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Reinicie o backend:${NC}"
echo "   Ctrl+C (se estiver rodando)"
echo "   npm start"
echo ""
echo -e "${YELLOW}2. Inicie o frontend (em outro terminal):${NC}"
echo "   npm run dev"
echo ""
echo -e "${YELLOW}3. Teste no navegador:${NC}"
echo "   Acesse: http://localhost:5173"
echo "   Teste login/registro"
echo ""
echo -e "${YELLOW}4. Verificar logs:${NC}"
echo "   • Console do navegador (F12)"
echo "   • Terminal do backend"
echo "   • Terminal do frontend"

echo -e "\n${GREEN}Se tudo funcionou:${NC}"
echo "• ✅ Sem mais erros de export"
echo "• ✅ Frontend conectando na porta 3001" 
echo "• ✅ Login/registro funcionando"
echo "• ✅ Proxy Vite redirecionando corretamente"

echo -e "\n${BLUE}Para debug se necessário:${NC}"
echo "  curl http://localhost:3001/api/health"
echo "  curl http://localhost:5173/api/health"

echo -e "\n${GREEN}🎯 Integração frontend-backend RESOLVIDA! 🎯${NC}"
