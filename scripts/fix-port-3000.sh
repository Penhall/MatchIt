# scripts/fix-port-3000.sh - Correção específica para backend na porta 3000

#!/bin/bash

echo "🔧 CORREÇÃO DE PORTA - BACKEND PARA PORTA 3000"
echo "==============================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto MatchIt"
    exit 1
fi

echo "✅ Diretório correto identificado"
echo "🎯 Objetivo: Backend na porta 3000, Frontend Vite na porta 5173"
echo ""

# 1. PARAR PROCESSOS EXISTENTES (Windows-compatible)
echo "🔧 Parando processos Node.js existentes..."

# Para Windows - usar taskkill em vez de lsof
if command -v taskkill >/dev/null 2>&1; then
    echo "   Windows detectado - usando taskkill"
    taskkill /F /IM node.exe 2>/dev/null || echo "   Nenhum processo Node.js encontrado"
else
    echo "   Tentando parar processos manualmente..."
    pkill -f "node.*server" 2>/dev/null || echo "   Nenhum processo servidor encontrado"
fi

echo "✅ Processos parados"

# 2. BACKUP DOS ARQUIVOS
echo ""
echo "📁 Criando backup dos arquivos de configuração..."

BACKUP_DIR="backup-port-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Lista de arquivos para backup
backup_files=(".env" "server/app.js" "vite.config.js" "src/services/api.ts" "package.json")

for file in "${backup_files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "   ✅ Backup: $file"
    fi
done

echo "📂 Backup salvo em: $BACKUP_DIR"

# 3. CORRIGIR .ENV
echo ""
echo "🔧 Corrigindo arquivo .env para porta 3000..."

cat > .env << 'EOF'
# ===== CONFIGURAÇÃO CORRIGIDA - PORTA 3000 =====

# Servidor Backend
NODE_ENV=development
PORT=3000

# URLs corrigidas
API_BASE_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:5173

# CORS - Permitir frontend Vite
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# JWT
JWT_SECRET=matchit_secret_key_development_2024
JWT_EXPIRES_IN=7d

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting (permissivo em desenvolvimento)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000

# Logs
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
EOF

echo "✅ Arquivo .env configurado para porta 3000"

# 4. CORRIGIR VITE CONFIG
echo ""
echo "🔧 Corrigindo vite.config.js..."

cat > vite.config.js << 'EOF'
// vite.config.js - Configuração corrigida para conectar no backend porta 3000
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
  
  // Servidor de desenvolvimento Vite
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false,
    
    // Proxy para API backend (porta 3000)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error:', err.message);
            console.error('🔴 Verifique se o backend está rodando na porta 3000');
            console.error('🔴 Execute: npm run server');
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 Proxy:', req.method, req.url, '→', 'http://localhost:3000' + req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '❌';
            console.log(`${emoji} Proxy [${proxyRes.statusCode}]:`, req.url);
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
  
  // Configuração para preview
  preview: {
    port: 4173,
    host: true,
    open: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
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
    __API_URL__: JSON.stringify('http://localhost:3000/api'),
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
});
EOF

echo "✅ vite.config.js configurado para conectar na porta 3000"

# 5. CORRIGIR API SERVICE
echo ""
echo "🔧 Corrigindo src/services/api.ts..."

if [ -f "src/services/api.ts" ]; then
    cat > src/services/api.ts << 'EOF'
// src/services/api.ts - API configurada para porta 3000
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// URL da API - CORRIGIDA PARA PORTA 3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔧 API configurada para PORTA 3000:', API_BASE_URL);

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
      console.error('🔴 CONEXÃO RECUSADA - Backend não está rodando na porta 3000');
      console.error('🔧 Execute: npm run server (para iniciar backend na porta 3000)');
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
      console.log('✅ Teste de conectividade OK (porta 3000):', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Teste de conectividade falhou (porta 3000):', error);
      return { success: false, error };
    }
  }
};

export default apiService;
export { API_BASE_URL };
EOF
    echo "✅ src/services/api.ts configurado para porta 3000"
else
    echo "⚠️  src/services/api.ts não encontrado - pode estar em outra localização"
fi

# 6. CRIAR .ENV.LOCAL PARA VITE
echo ""
echo "🔧 Criando .env.local para Vite..."

cat > .env.local << 'EOF'
# Variáveis do Vite - Backend na porta 3000
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
VITE_APP_NAME=MatchIt
VITE_ENVIRONMENT=development
EOF

echo "✅ .env.local criado para Vite"

# 7. ATUALIZAR PACKAGE.JSON
echo ""
echo "🔧 Atualizando scripts do package.json..."

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Backup
fs.writeFileSync('package.json.backup.' + Date.now(), JSON.stringify(pkg, null, 2));

// Scripts corrigidos para porta 3000
const correctedScripts = {
  'server': 'cross-env PORT=3000 node server/app.js',
  'backend': 'cross-env PORT=3000 node server/app.js',
  'dev': 'vite',
  'build': 'vite build',
  'preview': 'vite preview',
  'frontend': 'vite',
  'start:backend': 'cross-env PORT=3000 node server/app.js',
  'start:frontend': 'vite',
  'health': 'node -e \"require(\\\"http\\\").get(\\\"http://localhost:3000/api/health\\\", r => r.on(\\\"data\\\", d => console.log(d.toString())))\"',
  'test:api': 'curl http://localhost:3000/api/health',
  'dev:full': 'concurrently \"npm run server\" \"npm run dev\"'
};

pkg.scripts = { ...pkg.scripts, ...correctedScripts };

// Garantir que cross-env está nas devDependencies
if (!pkg.devDependencies) pkg.devDependencies = {};
if (!pkg.devDependencies['cross-env']) {
  pkg.devDependencies['cross-env'] = '^7.0.3';
}
if (!pkg.devDependencies['concurrently']) {
  pkg.devDependencies['concurrently'] = '^8.2.0';
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ package.json atualizado para porta 3000');
"

# 8. VERIFICAR SE CROSS-ENV ESTÁ INSTALADO
echo ""
echo "📦 Verificando dependências..."

if ! npm list cross-env >/dev/null 2>&1; then
    echo "   Instalando cross-env para Windows..."
    npm install --save-dev cross-env concurrently
    echo "✅ Dependências instaladas"
else
    echo "✅ Dependências já instaladas"
fi

# 9. CRIAR SCRIPT DE TESTE
echo ""
echo "🧪 Criando script de teste..."

cat > test-connection.js << 'EOF'
// test-connection.js - Teste de conectividade porta 3000
const http = require('http');

console.log('🧪 Testando conectividade na porta 3000...\n');

const testBackend = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Backend (porta 3000):', parsed.message || 'OK');
          resolve(true);
        } catch (e) {
          console.log('⚠️  Backend responde mas não é JSON válido');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend (porta 3000): NÃO CONECTOU');
      console.log('   Erro:', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend (porta 3000): TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
};

const testOldPort = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      console.log('⚠️  ATENÇÃO: Backend ainda está rodando na porta 3001');
      console.log('   Pare o processo e reinicie com: npm run server');
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('✅ Porta 3001: Livre (correto)');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

(async () => {
  const backendOk = await testBackend();
  const oldPortActive = await testOldPort();
  
  console.log('\n📋 RESUMO:');
  if (backendOk) {
    console.log('✅ Backend funcionando na porta 3000');
    console.log('✅ Configuração correta!');
  } else {
    console.log('❌ Backend NÃO está na porta 3000');
    console.log('🔧 Execute: npm run server');
  }
  
  if (oldPortActive) {
    console.log('⚠️  Processo antigo ainda ativo na porta 3001');
  }
  
  console.log('\n🎯 URLs corretas:');
  console.log('   Backend: http://localhost:3000');
  console.log('   Frontend: http://localhost:5173');
  console.log('   API Health: http://localhost:3000/api/health');
})();
EOF

echo "✅ Script de teste criado"

# 10. CRIAR SCRIPT DE INICIALIZAÇÃO
echo ""
echo "🚀 Criando script de inicialização start-correct.sh..."

cat > start-correct.sh << 'EOF'
#!/bin/bash
# start-correct.sh - Inicialização com configuração correta

echo "🚀 INICIANDO MATCHIT - CONFIGURAÇÃO CORRIGIDA"
echo "============================================="
echo ""
echo "🎯 Configuração:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""

# Função para cleanup
cleanup() {
    echo ""
    echo "🔴 Parando serviços..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   Backend parado"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   Frontend parado"
    fi
    exit 0
}

trap cleanup INT

# Verificar dependências
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Parar processos existentes (Windows-compatible)
echo "🔧 Limpando processos antigos..."
if command -v taskkill >/dev/null 2>&1; then
    taskkill /F /IM node.exe 2>/dev/null || true
else
    pkill -f "node.*server" 2>/dev/null || true
fi

echo ""
echo "🔧 Iniciando backend (porta 3000)..."
npm run server &
BACKEND_PID=$!

# Aguardar backend estar pronto
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Testar backend
echo "🧪 Testando backend..."
node test-connection.js

echo ""
echo "🎨 Iniciando frontend Vite (porta 5173)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SERVIÇOS INICIADOS!"
echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   API:      http://localhost:3000/api/health"
echo ""
echo "📝 Para ver logs:"
echo "   Backend: console atual"
echo "   Frontend: abra http://localhost:5173"
echo ""
echo "🔄 Pressione Ctrl+C para parar todos os serviços"
echo ""

# Aguardar
wait
EOF

chmod +x start-correct.sh

echo "✅ Script start-correct.sh criado"

# 11. RESULTADO FINAL
echo ""
echo "================================================================"
echo " CORREÇÃO CONCLUÍDA - PORTA 3000"
echo "================================================================"
echo ""
echo "📝 ARQUIVOS CORRIGIDOS:"
echo "   ✅ .env - Backend configurado para porta 3000"
echo "   ✅ vite.config.js - Proxy para porta 3000"
echo "   ✅ src/services/api.ts - API apontando para porta 3000"
echo "   ✅ .env.local - Variáveis Vite para porta 3000"
echo "   ✅ package.json - Scripts atualizados"
echo ""
echo "🚀 COMO USAR:"
echo ""
echo "   OPÇÃO 1 - Automático (RECOMENDADO):"
echo "   ./start-correct.sh"
echo ""
echo "   OPÇÃO 2 - Manual:"
echo "   Terminal 1: npm run server    (porta 3000)"
echo "   Terminal 2: npm run dev       (porta 5173)"
echo ""
echo "🧪 TESTE RÁPIDO:"
echo "   node test-connection.js"
echo ""
echo "🎯 URLs corretas:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000/api/health"
echo ""
echo "📁 Backup salvo em: $BACKUP_DIR"
echo ""
echo "✅ Agora o backend rodará na porta 3000!"
