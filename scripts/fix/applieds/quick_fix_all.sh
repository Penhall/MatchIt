# scripts/fix/quick_fix_all.sh - Aplicar todas as correções rapidamente

#!/bin/bash

echo "🚀 APLICANDO CORREÇÕES REACT → VITE..."

# 1. Backup rápido
echo "📦 Criando backups..."
[ -f "src/services/api.ts" ] && cp src/services/api.ts src/services/api.ts.backup
[ -f "src/context/AuthContext.tsx" ] && cp src/context/AuthContext.tsx src/context/AuthContext.tsx.backup
[ -f "vite.config.ts" ] && cp vite.config.ts vite.config.ts.backup

# 2. Corrigir api.ts
echo "🔧 Corrigindo api.ts..."
sed -i 's/process\.env\.REACT_APP_API_URL/import.meta.env.VITE_API_URL/g' src/services/api.ts 2>/dev/null || true

# 3. Corrigir vite.config.ts - remover rewrite problemático
echo "🔧 Corrigindo vite.config.ts..."
if [ -f "vite.config.ts" ]; then
    # Remover linha do rewrite se existir
    sed -i '/rewrite.*replace.*\/api/d' vite.config.ts 2>/dev/null || true
fi

# 4. Criar .env.local
echo "📝 Criando .env.local..."
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=MatchIt
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
NODE_ENV=development
PORT=3000
EOF

# 5. Criar vite-env.d.ts
echo "📝 Criando vite-env.d.ts..."
cat > src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
EOF

# 6. Verificar se backend está configurado para porta 3000
echo "🔍 Verificando configuração do backend..."
if [ -f "server/config/environment.js" ]; then
    if grep -q "port.*3000" server/config/environment.js; then
        echo "✅ Backend configurado para porta 3000"
    else
        echo "⚠️  Verificar porta do backend"
    fi
fi

echo ""
echo "✅ CORREÇÕES APLICADAS!"
echo ""
echo "Para testar:"
echo "1. npm start        # Iniciar backend"
echo "2. npm run dev      # Iniciar frontend (em outro terminal)"
echo "3. Testar login em: http://localhost:5173"
echo ""
echo "Para debug detalhado:"
echo "bash scripts/test/test_integration.sh"