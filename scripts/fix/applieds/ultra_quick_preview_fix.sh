# Correção ultra-rápida para preview mode (porta 4173)

#!/bin/bash

echo "🚀 CORREÇÃO PARA PREVIEW MODE (4173 → 3001)"

# 1. Corrigir API para porta 3001
echo "🔧 1/4 Corrigindo API..."
if [ -f "src/services/api.ts" ]; then
    cp src/services/api.ts src/services/api.ts.backup
    sed -i 's/localhost:3000/localhost:3001/g' src/services/api.ts
    sed -i 's/process\.env\.REACT_APP/import.meta.env.VITE/g' src/services/api.ts
fi

# 2. Criar .env.local
echo "🔧 2/4 Criando .env.local..."
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3001/api
EOF

# 3. Atualizar vite.config.ts para preview
echo "🔧 3/4 Configurando proxy preview..."
if [ -f "vite.config.ts" ]; then
    cp vite.config.ts vite.config.ts.backup
    
    # Verificar se já tem configuração de preview
    if ! grep -q "preview:" vite.config.ts; then
        echo "Adicionando configuração de preview..."
        # Adicionar configuração de preview antes do build
        sed -i '/build: {/i\
  preview: {\
    port: 4173,\
    host: true,\
    proxy: {\
      '"'"'/api'"'"': {\
        target: '"'"'http://localhost:3001'"'"',\
        changeOrigin: true,\
        secure: false\
      }\
    }\
  },\
' vite.config.ts
    else
        # Atualizar target existente
        sed -i 's/localhost:3000/localhost:3001/g' vite.config.ts
    fi
fi

# 4. Testar conectividade
echo "🔧 4/4 Testando conectividade..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend OK (3001)"
else
    echo "❌ Backend não responde (3001)"
fi

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🔄 PRÓXIMOS PASSOS:"
echo "1. Ctrl+C (parar preview atual)"
echo "2. npm run build"
echo "3. npm run preview"
echo ""
echo "🧪 TESTE DEPOIS:"
echo "curl http://localhost:4173/api/health"
