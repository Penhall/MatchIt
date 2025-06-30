# scripts/fix-frontend-access.sh - Correção completa para acesso ao frontend

#!/bin/bash

set -euo pipefail

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Variáveis globais
readonly PROJECT_ROOT="$(pwd)"
readonly BACKUP_DIR="${PROJECT_ROOT}/backup-frontend-fix-$(date +%Y%m%d_%H%M%S)"
readonly LOG_FILE="${PROJECT_ROOT}/frontend-fix.log"

# Funções de logging
log() {
    local message="$1"
    local color="${2:-$NC}"
    echo -e "${color}${message}${NC}" | tee -a "$LOG_FILE"
}

log_step() {
    local step="$1"
    local message="$2"
    log "\n🔄 ${step}: ${message}" "$BLUE"
}

log_success() {
    local message="$1"
    log "✅ ${message}" "$GREEN"
}

log_warning() {
    local message="$1"
    log "⚠️ ${message}" "$YELLOW"
}

log_error() {
    local message="$1"
    log "❌ ${message}" "$RED"
}

log_header() {
    local message="$1"
    log "\n================================================================" "$CYAN"
    log " ${message}" "$CYAN"
    log "================================================================" "$CYAN"
}

# Função principal
main() {
    log_header "CORREÇÃO DE ACESSO AO FRONTEND - MATCHIT"
    
    create_backup
    detect_frontend_type
    fix_port_configuration
    fix_cors_configuration
    fix_environment_variables
    fix_vite_configuration
    fix_docker_configuration
    test_configuration
    generate_usage_guide
    
    log_header "CORREÇÃO CONCLUÍDA COM SUCESSO"
}

# Criar backup
create_backup() {
    log_step "BACKUP" "Criando backup dos arquivos de configuração"
    
    mkdir -p "$BACKUP_DIR"
    
    local files_to_backup=(
        ".env" "vite.config.js" "package.json" "docker-compose.yml"
        "server/config/cors.js" "src/services/api.ts" "app.json" "expo.json"
    )
    
    for file in "${files_to_backup[@]}"; do
        if [[ -f "${PROJECT_ROOT}/${file}" ]]; then
            cp "${PROJECT_ROOT}/${file}" "${BACKUP_DIR}/"
            log_success "Backup: ${file}"
        fi
    done
    
    log_success "Backup salvo em: $(basename "$BACKUP_DIR")"
}

# Detectar tipo de frontend
detect_frontend_type() {
    log_step "DETECÇÃO" "Identificando tipo de frontend"
    
    if [[ -f "vite.config.js" ]] || [[ -f "vite.config.ts" ]]; then
        FRONTEND_TYPE="vite"
        FRONTEND_PORT="5173"
        log_success "Frontend Vite/React detectado"
    elif [[ -f "app.json" ]] || [[ -f "expo.json" ]]; then
        FRONTEND_TYPE="expo"
        FRONTEND_PORT="8081"
        log_success "Frontend React Native/Expo detectado"
    elif [[ -f "next.config.js" ]]; then
        FRONTEND_TYPE="nextjs"
        FRONTEND_PORT="3000"
        log_success "Frontend Next.js detectado"
    else
        FRONTEND_TYPE="unknown"
        FRONTEND_PORT="3000"
        log_warning "Tipo de frontend não identificado - assumindo padrão"
    fi
    
    log "Frontend: ${FRONTEND_TYPE}" "$CYAN"
    log "Porta: ${FRONTEND_PORT}" "$CYAN"
}

# Corrigir configuração de portas
fix_port_configuration() {
    log_step "PORTAS" "Corrigindo configuração de portas"
    
    # Definir portas padrão baseado no tipo de frontend
    case "$FRONTEND_TYPE" in
        "vite")
            BACKEND_PORT="3001"
            FRONTEND_PORT="5173"
            ;;
        "expo")
            BACKEND_PORT="3000"
            FRONTEND_PORT="8081"
            ;;
        "nextjs")
            BACKEND_PORT="3001"
            FRONTEND_PORT="3000"
            ;;
        *)
            BACKEND_PORT="3001"
            FRONTEND_PORT="5173"
            ;;
    esac
    
    log_success "Backend configurado para porta: ${BACKEND_PORT}"
    log_success "Frontend configurado para porta: ${FRONTEND_PORT}"
}

# Corrigir configuração CORS
fix_cors_configuration() {
    log_step "CORS" "Corrigindo configuração CORS"
    
    # Atualizar server/config/cors.js
    if [[ -f "server/config/cors.js" ]]; then
        cat > server/config/cors.js << EOF
// server/config/cors.js - Configuração CORS corrigida
import cors from 'cors';

const getCorsOptions = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Origens permitidas baseadas no ambiente
  const allowedOrigins = [
    // Desenvolvimento
    'http://localhost:${FRONTEND_PORT}',
    'http://localhost:${BACKEND_PORT}',
    'http://127.0.0.1:${FRONTEND_PORT}',
    'http://127.0.0.1:${BACKEND_PORT}',
    
    // React Native/Expo
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'exp://localhost:8081',
    
    // Vite dev server
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    
    // Docker
    'http://localhost:3000',
    'http://localhost:80',
    
    // Produção (adicione seus domínios)
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
  ];

  return {
    origin: function(origin, callback) {
      // Permitir requests sem origin (mobile apps, Postman, etc)
      if (!origin && isDevelopment) {
        return callback(null, true);
      }
      
      // Verificar se a origin está na lista permitida
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else if (isDevelopment) {
        // Em desenvolvimento, ser mais permissivo
        console.log('⚠️ CORS: Origin não listada mas permitida em dev:', origin);
        callback(null, true);
      } else {
        console.error('❌ CORS: Origin não permitida:', origin);
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin', 
      'X-Requested-With',
      'Access-Control-Allow-Headers'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 86400 // 24 horas
  };
};

const configureCors = () => {
  const options = getCorsOptions();
  console.log('🔧 CORS configurado para desenvolvimento');
  return cors(options);
};

export { configureCors, getCorsOptions };
EOF
        log_success "CORS configurado para desenvolvimento"
    else
        log_warning "Arquivo server/config/cors.js não encontrado"
    fi
}

# Corrigir variáveis de ambiente
fix_environment_variables() {
    log_step "ENV" "Corrigindo variáveis de ambiente"
    
    # Backup do .env atual
    if [[ -f ".env" ]]; then
        cp ".env" "${BACKUP_DIR}/.env.original"
    fi
    
    # Criar/atualizar .env
    cat > .env << EOF
# ===== CONFIGURAÇÃO DE DESENVOLVIMENTO CORRIGIDA =====

# Servidor Backend
NODE_ENV=development
PORT=${BACKEND_PORT}

# URLs para desenvolvimento
API_BASE_URL=http://localhost:${BACKEND_PORT}/api
FRONTEND_URL=http://localhost:${FRONTEND_PORT}
CORS_ORIGINS=http://localhost:${FRONTEND_PORT},http://localhost:${BACKEND_PORT},http://localhost:8081,http://localhost:5173

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=matchit_secret_key_development_2024
JWT_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
UPLOAD_PATH=./uploads

# Logs
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# Rate Limiting (mais permissivo em dev)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000
UPLOAD_RATE_LIMIT_MAX=100
EOF

    # Criar .env.local para Vite (se for frontend Vite)
    if [[ "$FRONTEND_TYPE" == "vite" ]]; then
        cat > .env.local << EOF
# Variáveis do Vite (frontend)
VITE_API_URL=http://localhost:${BACKEND_PORT}/api
VITE_BACKEND_URL=http://localhost:${BACKEND_PORT}
VITE_APP_NAME=MatchIt
VITE_ENVIRONMENT=development
EOF
        log_success "Arquivo .env.local criado para Vite"
    fi
    
    log_success "Variáveis de ambiente configuradas"
}

# Corrigir configuração do Vite
fix_vite_configuration() {
    if [[ "$FRONTEND_TYPE" != "vite" ]]; then
        return
    fi
    
    log_step "VITE" "Corrigindo configuração do Vite"
    
    cat > vite.config.js << EOF
// vite.config.js - Configuração corrigida para desenvolvimento
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Aliases para imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@screens': path.resolve(__dirname, './screens'),
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },
  
  // Servidor de desenvolvimento
  server: {
    port: ${FRONTEND_PORT},
    host: true,
    open: true,
    strictPort: false,
    
    // Proxy para API
    proxy: {
      '/api': {
        target: 'http://localhost:${BACKEND_PORT}',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error:', err.message);
            console.error('🔴 Verifique se o backend está rodando na porta ${BACKEND_PORT}');
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 Proxy:', req.method, req.url, '→', 'http://localhost:${BACKEND_PORT}' + req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '❌';
            console.log(\`\${emoji} Proxy [\${proxyRes.statusCode}]:\`, req.url);
          });
        }
      },
      
      // Proxy para uploads
      '/uploads': {
        target: 'http://localhost:${BACKEND_PORT}',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Configuração para preview
  preview: {
    port: 4173,
    host: true,
    open: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:${BACKEND_PORT}',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  
  // Definir variáveis globais
  define: {
    __API_URL__: JSON.stringify('http://localhost:${BACKEND_PORT}/api'),
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
});
EOF
    
    # Atualizar src/services/api.ts se existir
    if [[ -f "src/services/api.ts" ]]; then
        cat > src/services/api.ts << EOF
// src/services/api.ts - Configuração de API corrigida
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// URL da API baseada nas variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:${BACKEND_PORT}/api';

console.log('🔧 API configurada para:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
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
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🎯 Full URL:', \`\${config.baseURL}\${config.url}\`);
    
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
      fullUrl: error.config ? \`\${error.config.baseURL}\${error.config.url}\` : 'N/A'
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 CONEXÃO RECUSADA - Verifique se backend está rodando na porta ${BACKEND_PORT}');
      console.error('🔧 Execute: npm run server (em outra janela do terminal)');
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
  patch: <T>(endpoint: string, body: any) => api.patch<T>(endpoint, body),
  
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
        log_success "Arquivo src/services/api.ts atualizado"
    fi
    
    log_success "Configuração do Vite corrigida"
}

# Corrigir configuração do Docker
fix_docker_configuration() {
    log_step "DOCKER" "Corrigindo configuração Docker"
    
    if [[ -f "docker-compose.yml" ]]; then
        # Atualizar portas no docker-compose.yml
        sed -i.bak "s/\"3000:3000\"/\"${BACKEND_PORT}:3000\"/g" docker-compose.yml
        sed -i.bak "s/\"3001:3000\"/\"${BACKEND_PORT}:3000\"/g" docker-compose.yml
        
        # Atualizar CORS_ORIGIN
        sed -i.bak "s/CORS_ORIGIN: \${CORS_ORIGIN:-.*}/CORS_ORIGIN: http:\/\/localhost:${FRONTEND_PORT}/g" docker-compose.yml
        
        log_success "Docker Compose atualizado para porta ${BACKEND_PORT}"
    fi
}

# Testar configuração
test_configuration() {
    log_step "TESTE" "Testando configuração"
    
    # Verificar se as portas estão livres
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :${BACKEND_PORT} >/dev/null 2>&1; then
            log_warning "Porta ${BACKEND_PORT} está em uso - pode ser necessário parar o processo"
        else
            log_success "Porta ${BACKEND_PORT} disponível para backend"
        fi
        
        if lsof -i :${FRONTEND_PORT} >/dev/null 2>&1; then
            log_warning "Porta ${FRONTEND_PORT} está em uso - pode ser necessário parar o processo"
        else
            log_success "Porta ${FRONTEND_PORT} disponível para frontend"
        fi
    fi
    
    # Verificar se arquivos essenciais existem
    local essential_files=("package.json" "server/app.js")
    for file in "${essential_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Arquivo essencial encontrado: $file"
        else
            log_error "Arquivo essencial não encontrado: $file"
        fi
    done
}

# Gerar guia de uso
generate_usage_guide() {
    log_step "GUIA" "Gerando guia de uso"
    
    cat > FRONTEND_ACCESS_GUIDE.md << EOF
# 🚀 Guia de Acesso ao Frontend - MatchIt

## ✅ Configuração Corrigida

**Frontend Tipo:** ${FRONTEND_TYPE}
**Frontend Porta:** ${FRONTEND_PORT}
**Backend Porta:** ${BACKEND_PORT}

## 🔧 Como Iniciar

### 1. Backend (Terminal 1)
\`\`\`bash
# Instalar dependências (se necessário)
npm install

# Iniciar backend
npm run server
# ou
node server/app.js
\`\`\`

O backend estará disponível em: **http://localhost:${BACKEND_PORT}**

### 2. Frontend (Terminal 2)
EOF

    case "$FRONTEND_TYPE" in
        "vite")
            cat >> FRONTEND_ACCESS_GUIDE.md << EOF

\`\`\`bash
# Instalar dependências (se necessário)
npm install

# Iniciar frontend Vite
npm run dev
\`\`\`

O frontend estará disponível em: **http://localhost:${FRONTEND_PORT}**
EOF
            ;;
        "expo")
            cat >> FRONTEND_ACCESS_GUIDE.md << EOF

\`\`\`bash
# Instalar dependências (se necessário)
npm install

# Iniciar Expo
npx expo start
# ou
npm start
\`\`\`

O frontend estará disponível via Expo Metro em: **http://localhost:${FRONTEND_PORT}**
EOF
            ;;
        *)
            cat >> FRONTEND_ACCESS_GUIDE.md << EOF

\`\`\`bash
# Iniciar servidor de desenvolvimento
npm run dev
# ou
npm start
\`\`\`

O frontend estará disponível em: **http://localhost:${FRONTEND_PORT}**
EOF
            ;;
    esac

    cat >> FRONTEND_ACCESS_GUIDE.md << EOF

## 🐳 Docker (Alternativa)

\`\`\`bash
# Desenvolvimento
./docker-dev.sh

# Produção
./docker-prod.sh
\`\`\`

## 🔍 Verificação

### Testar Backend
\`\`\`bash
curl http://localhost:${BACKEND_PORT}/api/health
\`\`\`

### Testar Frontend
Abra no navegador: **http://localhost:${FRONTEND_PORT}**

## ❌ Problemas Comuns

### 1. "ECONNREFUSED"
- ✅ Verifique se o backend está rodando na porta ${BACKEND_PORT}
- ✅ Execute: \`npm run server\` em outro terminal

### 2. "Porta já em uso"
- ✅ Pare outros processos nas portas ${FRONTEND_PORT} e ${BACKEND_PORT}
- ✅ Use: \`lsof -i :${BACKEND_PORT}\` para encontrar o processo

### 3. "CORS Error"
- ✅ Verifique se ambos estão rodando nas portas corretas
- ✅ Limpe o cache do navegador (Ctrl+Shift+R)

### 4. Frontend não carrega
- ✅ Verifique se \`npm install\` foi executado
- ✅ Verifique se não há erros no console do navegador

## 📝 Logs Úteis

### Backend
\`\`\`bash
# Ver logs do servidor
tail -f logs/app.log
\`\`\`

### Frontend (Vite)
- Logs aparecem no terminal onde executou \`npm run dev\`
- Console do navegador (F12)

## 🔄 Resetar Configuração

Se ainda houver problemas:

\`\`\`bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Resetar configuração Docker
./docker-reset.sh
\`\`\`

---
*Correção aplicada em: $(date)*
*Backup salvo em: $(basename "$BACKUP_DIR")*
EOF

    log_success "Guia de uso criado: FRONTEND_ACCESS_GUIDE.md"
}

# Executar função principal
main "$@"
