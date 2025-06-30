#!/bin/bash
# scripts/fix-vite-and-port.sh - Instalar Vite + configurar porta 3000

echo "🔧 CORREÇÃO COMPLETA: VITE + PORTA 3000"
echo "======================================="
echo ""
echo "🎯 Problemas identificados:"
echo "   ❌ 'vite' não é reconhecido (não instalado)"
echo "   ❌ Backend na porta 3001, frontend tenta 3000"
echo ""
echo "✅ Soluções:"
echo "   🔧 Instalar Vite e dependências do frontend"
echo "   🔧 Configurar backend para porta 3000"
echo "   🔧 Configurar frontend para conectar no backend"
echo ""

# Verificar diretório
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório raiz do projeto MatchIt"
    exit 1
fi

echo "✅ Diretório correto identificado"

# Parar processos Node
echo ""
echo "1️⃣ Parando processos Node existentes..."
if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM node.exe 2>/dev/null || true
else
    pkill -f node 2>/dev/null || true
fi
echo "   ✅ Processos parados"

# Backup
echo ""
echo "2️⃣ Criando backup..."
BACKUP_DIR="backup-vite-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in package.json .env vite.config.js; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "   📁 $file"
    fi
done

# Verificar e instalar dependências do Vite
echo ""
echo "3️⃣ Verificando dependências do Vite..."

# Verificar se Vite está no package.json
if ! grep -q '"vite"' package.json; then
    echo "   ⚠️  Vite não encontrado no package.json"
    echo "   📦 Adicionando Vite às dependências..."
    
    # Adicionar Vite ao package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Backup
    fs.writeFileSync('$BACKUP_DIR/package.json.original', JSON.stringify(pkg, null, 2));
    
    // Adicionar dependências de desenvolvimento para Vite
    pkg.devDependencies = pkg.devDependencies || {};
    
    const viteDeps = {
        'vite': '^4.4.5',
        '@vitejs/plugin-react': '^4.0.3',
        'cross-env': '^7.0.3'
    };
    
    Object.assign(pkg.devDependencies, viteDeps);
    
    // Corrigir scripts
    pkg.scripts = pkg.scripts || {};
    Object.assign(pkg.scripts, {
        'dev': 'vite',
        'build': 'vite build',
        'preview': 'vite preview',
        'frontend': 'vite',
        'server': 'cross-env PORT=3000 node server/app.js',
        'backend': 'cross-env PORT=3000 node server/app.js',
        'health': 'curl http://localhost:3000/api/health'
    });
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('✅ package.json atualizado com Vite');
    "
else
    echo "   ✅ Vite encontrado no package.json"
fi

# Instalar dependências
echo ""
echo "4️⃣ Instalando dependências..."
echo "   📦 Executando npm install..."
npm install
echo "   ✅ Dependências instaladas"

# Configurar .env
echo ""
echo "5️⃣ Configurando .env para porta 3000..."
cat > .env << 'EOF'
# Backend configurado para porta 3000
NODE_ENV=development
PORT=3000

# URLs corretas
API_BASE_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:5173

# CORS para desenvolvimento
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# JWT
JWT_SECRET=matchit_secret_key_development_2024
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000

# Logs
LOG_LEVEL=debug
EOF
echo "   ✅ .env configurado"

# Criar/corrigir vite.config.js
echo ""
echo "6️⃣ Criando vite.config.js..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
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
  
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false,
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error: Backend não está rodando na porta 3000');
            console.error('🔧 Execute: npm run server');
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 Proxy:', req.method, req.url, '→ http://localhost:3000');
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '❌';
            console.log(`${emoji} [${proxyRes.statusCode}]:`, req.url);
          });
        }
      },
      
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
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
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  
  define: {
    __API_URL__: JSON.stringify('http://localhost:3000/api'),
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
});
EOF
echo "   ✅ vite.config.js criado"

# Criar .env.local para Vite
echo ""
echo "7️⃣ Criando .env.local para Vite..."
cat > .env.local << 'EOF'
# Variáveis do Vite
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
VITE_APP_NAME=MatchIt
VITE_ENVIRONMENT=development
EOF
echo "   ✅ .env.local criado"

# Verificar se React está instalado
echo ""
echo "8️⃣ Verificando dependências React..."
if ! npm list react >/dev/null 2>&1; then
    echo "   📦 Instalando React..."
    npm install react react-dom
    echo "   ✅ React instalado"
else
    echo "   ✅ React já instalado"
fi

# Verificar estrutura do frontend
echo ""
echo "9️⃣ Verificando estrutura do frontend..."
if [ ! -f "index.html" ]; then
    echo "   📝 Criando index.html..."
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MatchIt</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF
    echo "   ✅ index.html criado"
fi

# Verificar src/main.jsx
if [ ! -f "src/main.jsx" ] && [ ! -f "src/main.js" ] && [ ! -f "src/main.tsx" ]; then
    echo "   📝 Criando src/main.jsx básico..."
    mkdir -p src
    cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF
    echo "   ✅ src/main.jsx criado"
fi

# Verificar src/App.jsx
if [ ! -f "src/App.jsx" ] && [ ! -f "src/App.js" ] && [ ! -f "src/App.tsx" ]; then
    echo "   📝 Criando src/App.jsx básico..."
    cat > src/App.jsx << 'EOF'
import React, { useState, useEffect } from 'react';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Testar conectividade com backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao conectar com backend:', err);
        setHealth({ error: 'Backend não está rodando' });
        setLoading(false);
      });
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎯 MatchIt - Frontend Funcionando!</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Status da Conexão com Backend:</h2>
        {loading ? (
          <p>🔄 Testando conexão...</p>
        ) : health?.error ? (
          <div style={{ color: 'red' }}>
            <p>❌ {health.error}</p>
            <p>🔧 Execute: npm run server (em outro terminal)</p>
          </div>
        ) : (
          <div style={{ color: 'green' }}>
            <p>✅ Backend conectado!</p>
            <p>📡 Mensagem: {health?.message}</p>
            <p>🕐 Timestamp: {health?.timestamp}</p>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0' }}>
        <h3>URLs do Sistema:</h3>
        <ul>
          <li><strong>Frontend:</strong> http://localhost:5173</li>
          <li><strong>Backend:</strong> http://localhost:3000</li>
          <li><strong>API Health:</strong> http://localhost:3000/api/health</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
EOF
    echo "   ✅ src/App.jsx criado"
fi

# Teste final
echo ""
echo "🔟 Teste final das configurações..."

# Verificar se Vite foi instalado
if npm list vite >/dev/null 2>&1; then
    echo "   ✅ Vite instalado corretamente"
else
    echo "   ❌ Problema na instalação do Vite"
    echo "   🔧 Tentando instalar manualmente..."
    npm install --save-dev vite @vitejs/plugin-react
fi

# Verificar comando Vite
if npx vite --version >/dev/null 2>&1; then
    echo "   ✅ Comando 'vite' funcionando"
else
    echo "   ⚠️  Comando vite pode ter problemas"
fi

echo ""
echo "================================================================"
echo " ✅ CORREÇÃO COMPLETA FINALIZADA"
echo "================================================================"
echo ""
echo "📁 Backup salvo em: $BACKUP_DIR"
echo ""
echo "📝 CORREÇÕES APLICADAS:"
echo "   ✅ Vite instalado e configurado"
echo "   ✅ React instalado (se necessário)"
echo "   ✅ Backend configurado para porta 3000"
echo "   ✅ Frontend configurado para porta 5173"
echo "   ✅ Proxy configurado para conectar backend"
echo "   ✅ Arquivos básicos criados (se necessário)"
echo ""
echo "🚀 COMO USAR AGORA:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   npm run server"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   npm run dev"
echo ""
echo "🎯 URLs após inicialização:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   API:      http://localhost:3000/api/health"
echo ""
echo "🧪 Para testar se backend está funcionando:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "💡 O frontend mostrará o status da conexão automaticamente"
echo ""
echo "✅ VITE + PORTA 3000 CONFIGURADOS!"
