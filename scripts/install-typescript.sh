#!/bin/bash
# scripts/install-typescript.sh - Instalar TypeScript e dependências relacionadas

echo "🔧 Instalando TypeScript e dependências relacionadas..."
echo "======================================================"

# Instalar TypeScript como dependência de desenvolvimento
echo "📦 Instalando TypeScript..."
npm install --save-dev typescript

# Instalar tipos para React (essencial para projetos React com TypeScript)
echo "📦 Instalando tipos do React..."
npm install --save-dev @types/react @types/react-dom

# Instalar tipos para Node.js (necessário para configurações Vite/build)
echo "📦 Instalando tipos do Node.js..."
npm install --save-dev @types/node

# Se usar React Router, instalar os tipos também
echo "📦 Instalando tipos do React Router..."
npm install --save-dev @types/react-router-dom

# Verificar se a instalação foi bem-sucedida
echo ""
echo "✅ Verificando instalação..."

if npm list typescript &>/dev/null; then
    echo "✅ TypeScript instalado com sucesso!"
    echo "   Versão: $(npm list typescript --depth=0 | grep typescript | sed 's/.*@//')"
else
    echo "❌ Erro na instalação do TypeScript"
    exit 1
fi

if npm list @types/react &>/dev/null; then
    echo "✅ @types/react instalado com sucesso!"
else
    echo "❌ Erro na instalação dos tipos React"
fi

if npm list @types/node &>/dev/null; then
    echo "✅ @types/node instalado com sucesso!"
else
    echo "❌ Erro na instalação dos tipos Node"
fi

echo ""
echo "🎯 Próximos passos:"
echo "   1. Verificar se o tsconfig.json existe"
echo "   2. Executar 'npx tsc --noEmit' para verificar erros TypeScript"
echo "   3. Executar 'npm run dev' para testar o projeto"

echo ""
echo "📋 Dependências TypeScript instaladas:"
echo "   • typescript"
echo "   • @types/react"
echo "   • @types/react-dom"
echo "   • @types/node"
echo "   • @types/react-router-dom"