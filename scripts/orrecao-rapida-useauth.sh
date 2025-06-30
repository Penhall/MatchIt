# scripts/correcao-rapida-useauth.sh - Correção do erro JSX em useAuth.ts
#!/bin/bash

echo "🔧 CORREÇÃO RÁPIDA - useAuth.ts → useAuth.tsx"
echo "=============================================="

# Backup do arquivo atual
if [ -f "src/hooks/useAuth.ts" ]; then
    echo "📁 Fazendo backup de useAuth.ts..."
    cp "src/hooks/useAuth.ts" "src/hooks/useAuth.ts.backup-$(date +%H%M%S)"
    echo "✅ Backup criado"
fi

# Verificar se já existe useAuth.tsx
if [ -f "src/hooks/useAuth.tsx" ]; then
    echo "⚠️  useAuth.tsx já existe, removendo useAuth.ts..."
    rm -f "src/hooks/useAuth.ts"
    echo "✅ useAuth.ts removido (mantendo .tsx)"
else
    echo "🔄 Convertendo useAuth.ts para useAuth.tsx..."
    
    # Renomear arquivo
    mv "src/hooks/useAuth.ts" "src/hooks/useAuth.tsx"
    echo "✅ Arquivo renomeado para .tsx"
fi

# Verificar se o arquivo existe e corrigir imports se necessário
if [ -f "src/hooks/useAuth.tsx" ]; then
    echo "🔍 Verificando conteúdo do arquivo..."
    
    # Verificar se tem a importação do React
    if ! grep -q "import React" "src/hooks/useAuth.tsx"; then
        echo "🔧 Adicionando import do React..."
        sed -i.bak '1i import React from '\''react'\'';' "src/hooks/useAuth.tsx"
        rm -f "src/hooks/useAuth.tsx.bak"
        echo "✅ Import do React adicionado"
    fi
    
    echo "✅ useAuth.tsx está configurado corretamente"
else
    echo "❌ Erro: useAuth.tsx não encontrado!"
    exit 1
fi

# Verificar se App.tsx está importando corretamente
echo "🔍 Verificando imports em App.tsx..."
if [ -f "src/App.tsx" ]; then
    if grep -q "from './hooks/useAuth'" "src/App.tsx"; then
        echo "✅ Import em App.tsx está correto (auto-resolve .tsx)"
    else
        echo "⚠️  Import do useAuth não encontrado em App.tsx"
    fi
fi

echo ""
echo "=============================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "=============================================="
echo ""
echo "O que foi feito:"
echo "  ✅ useAuth.ts → useAuth.tsx (extensão corrigida)"
echo "  ✅ Import React adicionado (se necessário)"
echo "  ✅ Backup do arquivo original criado"
echo ""
echo "Agora teste novamente:"
echo "  npm run dev"
echo ""
echo "Se ainda houver erro, verifique:"
echo "  1. Se existe import duplicado de React"
echo "  2. Se há erros de sintaxe no arquivo"
echo "=============================================="