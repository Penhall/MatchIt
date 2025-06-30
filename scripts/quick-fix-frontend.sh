# scripts/quick-fix-frontend.sh - Correção rápida para problemas de acesso ao frontend

#!/bin/bash

echo "🔧 CORREÇÃO RÁPIDA - ACESSO AO FRONTEND"
echo "======================================"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto MatchIt"
    exit 1
fi

echo "✅ Diretório correto identificado"

# 1. DETECTAR TIPO DE FRONTEND
echo ""
echo "🔍 Detectando tipo de frontend..."

if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
    FRONTEND_TYPE="vite"
    FRONTEND_PORT="5173"
    BACKEND_PORT="3001"
    echo "✅ Frontend Vite detectado"
elif [ -f "app.json" ] || [ -f "expo.json" ]; then
    FRONTEND_TYPE="expo"
    FRONTEND_PORT="8081"
    BACKEND_PORT="3000"
    echo "✅ Frontend React Native/Expo detectado"
else
    FRONTEND_TYPE="web"
    FRONTEND_PORT="3000"
    BACKEND_PORT="3001"
    echo "⚠️  Tipo de frontend padrão assumido"
fi

echo "   Frontend: $FRONTEND_TYPE (porta $FRONTEND_PORT)"
echo "   Backend: porta $BACKEND_PORT"

# 2. CORRIGIR .ENV
echo ""
echo "🔧 Corrigindo arquivo .env..."

# Backup do .env se existir
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   📁 Backup do .env criado"
fi

# Criar .env corrigido
cat > .env << EOF
# ===== CONFIGURAÇÃO CORRIGIDA - MATCHIT =====

# Servidor
NODE_ENV=development
PORT=$BACKEND_PORT

# URLs
API_BASE_URL=http://localhost:$BACKEND_PORT/api
FRONTEND_URL=http://localhost:$FRONTEND_PORT

# CORS - Permitir todas as origens de desenvolvimento
CORS_ORIGINS=http://localhost:$FRONTEND_PORT,http://localhost:$BACKEND_PORT,http://localhost:8081,http://localhost:5173,http://localhost:3000,http://127.0.0.1:$FRONTEND_PORT,http://127.0.0.1:$BACKEND_PORT

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
EOF

echo "✅ Arquivo .env corrigido"

# 3. CORRIGIR CORS NO BACKEND (se existir)
if [ -f "server/config/cors.js" ]; then
    echo ""
    echo "🔧 Corrigindo configuração CORS..."
    
    cat > server/config/cors.js << 'EOF'
// server/config/cors.js - CORS permissivo para desenvolvimento
import cors from 'cors';

const getCorsOptions = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Em desenvolvimento, ser bem permissivo
    return {
      origin: true, // Permite qualquer origem
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Authorization'],
      maxAge: 86400
    };
  }
  
  // Em produção, usar lista específica
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
  
  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400
  };
};

const configureCors = () => {
  return cors(getCorsOptions());
};

export { configureCors, getCorsOptions };
EOF
    
    echo "✅ CORS configurado para desenvolvimento permissivo"
fi

# 4. ADICIONAR MIDDLEWARE CORS NO APP.JS (se necessário)
if [ -f "server/app.js" ]; then
    echo ""
    echo "🔧 Verificando middleware CORS no app.js..."
    
    # Verificar se já tem configuração CORS
    if ! grep -q "cors" server/app.js; then
        echo "⚠️  Adicionando configuração CORS básica..."
        
        # Backup do app.js
        cp server/app.js server/app.js.backup.$(date +%Y%m%d_%H%M%S)
        
        # Adicionar CORS básico no início do arquivo (após imports)
        sed -i '1a\\n// CORS configuração rápida\napp.use((req, res, next) => {\n  res.header("Access-Control-Allow-Origin", "*");\n  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");\n  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");\n  if (req.method === "OPTIONS") {\n    return res.status(200).end();\n  }\n  next();\n});\n' server/app.js
        
        echo "✅ CORS básico adicionado ao app.js"
    else
        echo "✅ CORS já configurado no app.js"
    fi
fi

# 5. CORRIGIR PACKAGE.JSON
echo ""
echo "🔧 Corrigindo scripts do package.json..."

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Backup
fs.writeFileSync('package.json.backup.' + Date.now(), JSON.stringify(pkg, null, 2));

// Scripts corrigidos baseados no tipo de frontend
const frontendType = '$FRONTEND_TYPE';
const backendPort = '$BACKEND_PORT';

const baseScripts = {
  'server': 'node server/app.js',
  'backend': 'node server/app.js',
  'health': 'node -e \"require(\\\"http\\\").get(\\\"http://localhost:' + backendPort + '/api/health\\\", r => r.on(\\\"data\\\", d => console.log(d.toString())))\"'
};

if (frontendType === 'vite') {
  Object.assign(baseScripts, {
    'dev': 'vite',
    'build': 'vite build',
    'preview': 'vite preview',
    'frontend': 'vite'
  });
} else if (frontendType === 'expo') {
  Object.assign(baseScripts, {
    'start': 'expo start',
    'android': 'expo start --android',
    'ios': 'expo start --ios',
    'web': 'expo start --web',
    'frontend': 'expo start'
  });
}

pkg.scripts = { ...pkg.scripts, ...baseScripts };

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Scripts do package.json atualizados');
"

# 6. MATAR PROCESSOS NAS PORTAS (se necessário)
echo ""
echo "🔧 Verificando portas em uso..."

# Função para matar processo em uma porta
kill_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        if [ ! -z "$pid" ]; then
            echo "   ⚠️  Matando processo na porta $port (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    fi
}

# Matar processos nas portas se necessário
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

echo "✅ Portas liberadas"

# 7. CRIAR SCRIPT DE INICIALIZAÇÃO AUTOMÁTICA
echo ""
echo "🔧 Criando script de inicialização..."

cat > start-dev.sh << EOF
#!/bin/bash
# start-dev.sh - Inicialização automática do ambiente de desenvolvimento

echo "🚀 Iniciando ambiente de desenvolvimento MatchIt..."
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🔧 Configuração:"
echo "   Backend: http://localhost:$BACKEND_PORT"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo ""

# Função para matar processos ao sair
cleanup() {
    echo ""
    echo "🔴 Parando serviços..."
    kill \$BACKEND_PID 2>/dev/null
    kill \$FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT

# Iniciar backend
echo "🔧 Iniciando backend (porta $BACKEND_PORT)..."
npm run server &
BACKEND_PID=\$!

# Aguardar um pouco
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend (porta $FRONTEND_PORT)..."
if [ "$FRONTEND_TYPE" = "vite" ]; then
    npm run dev &
elif [ "$FRONTEND_TYPE" = "expo" ]; then
    npm start &
else
    echo "⚠️  Inicie o frontend manualmente"
fi
FRONTEND_PID=\$!

echo ""
echo "✅ Serviços iniciados!"
echo "   Backend: http://localhost:$BACKEND_PORT/api/health"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait
EOF

chmod +x start-dev.sh

echo "✅ Script start-dev.sh criado"

# 8. TESTE RÁPIDO
echo ""
echo "🧪 Testando configuração..."

# Verificar se arquivos essenciais existem
if [ -f "server/app.js" ]; then
    echo "✅ server/app.js encontrado"
else
    echo "❌ server/app.js NÃO encontrado"
fi

if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json NÃO encontrado"
fi

# 9. INSTRUÇÕES FINAIS
echo ""
echo "================================================================"
echo " CORREÇÃO CONCLUÍDA - COMO USAR"
echo "================================================================"
echo ""
echo "🚀 OPÇÃO 1 - Inicialização automática (RECOMENDADO):"
echo "   ./start-dev.sh"
echo ""
echo "🚀 OPÇÃO 2 - Manual (2 terminais):"
echo "   Terminal 1: npm run server"

if [ "$FRONTEND_TYPE" = "vite" ]; then
    echo "   Terminal 2: npm run dev"
    echo "   Acesse: http://localhost:5173"
elif [ "$FRONTEND_TYPE" = "expo" ]; then
    echo "   Terminal 2: npm start"
    echo "   Use o app Expo Go ou simulador"
else
    echo "   Terminal 2: npm run frontend"
    echo "   Acesse: http://localhost:$FRONTEND_PORT"
fi

echo ""
echo "🩺 VERIFICAÇÃO DE SAÚDE:"
echo "   npm run health"
echo ""
echo "🔧 URLs importantes:"
echo "   Backend: http://localhost:$BACKEND_PORT/api/health"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "❌ PROBLEMAS COMUNS:"
echo "   1. Porta em uso → Execute: ./start-dev.sh (mata processos automaticamente)"
echo "   2. CORS error → Já corrigido neste script"
echo "   3. Dependências → Execute: npm install"
echo ""
echo "✅ Correção concluída! Use ./start-dev.sh para começar."
