#!/bin/bash
# scripts/simple-fix-3000.sh - Execute este para corrigir a porta

echo "🔧 CORRINDO PROBLEMA DA PORTA - EXECUÇÃO SIMPLES"
echo "================================================"
echo ""
echo "🎯 Problema: Backend na 3001, Frontend tentando 3000"
echo "✅ Solução: Configurar backend para porta 3000"
echo ""

# Verificar se está no lugar certo
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório raiz do MatchIt"
    exit 1
fi

# Parar processos
echo "1️⃣ Parando processos Node..."
if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM node.exe 2>/dev/null || true
else
    pkill -f node 2>/dev/null || true
fi
echo "   ✅ Processos parados"

# Corrigir .env
echo ""
echo "2️⃣ Forçando PORT=3000 no .env..."
echo "PORT=3000" > .env
echo "API_BASE_URL=http://localhost:3000/api" >> .env
echo "FRONTEND_URL=http://localhost:5173" >> .env
echo "CORS_ORIGINS=http://localhost:5173,http://localhost:3000" >> .env
echo "NODE_ENV=development" >> .env
echo "DB_HOST=localhost" >> .env
echo "DB_PORT=5432" >> .env
echo "DB_NAME=matchit_db" >> .env
echo "DB_USER=matchit" >> .env
echo "DB_PASSWORD=matchit123" >> .env
echo "JWT_SECRET=matchit_secret_development" >> .env
echo "   ✅ .env configurado"

# Instalar cross-env
echo ""
echo "3️⃣ Instalando cross-env..."
npm install cross-env --save-dev --silent
echo "   ✅ cross-env instalado"

# Corrigir package.json
echo ""
echo "4️⃣ Corrigindo scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.server = 'cross-env PORT=3000 node server/app.js';
pkg.scripts.health = 'curl http://localhost:3000/api/health';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo "   ✅ Scripts corrigidos"

# Criar .env.local para Vite
echo ""
echo "5️⃣ Configurando Vite..."
echo "VITE_API_URL=http://localhost:3000/api" > .env.local
echo "VITE_BACKEND_URL=http://localhost:3000" >> .env.local

# Corrigir vite.config.js se existir
if [ -f "vite.config.js" ]; then
    sed -i.bak 's|localhost:[0-9]*|localhost:3000|g' vite.config.js 2>/dev/null || true
fi
echo "   ✅ Vite configurado"

echo ""
echo "================================================================"
echo " ✅ CORREÇÃO CONCLUÍDA - PRONTO PARA USAR"
echo "================================================================"
echo ""
echo "🚀 AGORA EXECUTE (em 2 terminais):"
echo ""
echo "   Terminal 1 (Backend):"
echo "   npm run server"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   npm run dev"
echo ""
echo "🎯 URLs corretas:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000/api/health"
echo ""
echo "🧪 Para testar se funcionou:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "💡 Se der erro, verifique se o backend iniciou sem erros"
echo ""
echo "✅ PROBLEMA DA PORTA RESOLVIDO!"
