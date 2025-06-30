#!/bin/bash
# scripts/minimal-fix.sh - Correção mínima para fazer o Vite funcionar

echo "🎯 CORREÇÃO MÍNIMA - SÓ O ESSENCIAL"
echo "==================================="
echo ""
echo "Fazendo apenas as correções mínimas para o Vite funcionar"
echo ""

# 1. Instalar dependências que estão causando erro de import
echo "1️⃣ Instalando dependências básicas..."
npm install react-router-dom axios --silent

# 2. Renomear arquivos .ts com JSX
echo "2️⃣ Corrigindo extensões de arquivo..."
[ -f "screens/StyleAdjustmentScreen.ts" ] && mv "screens/StyleAdjustmentScreen.ts" "screens/StyleAdjustmentScreen.tsx" && echo "   ✅ StyleAdjustmentScreen.ts → .tsx"
[ -f "screens/SettingsScreen.ts" ] && mv "screens/SettingsScreen.ts" "screens/SettingsScreen.tsx" && echo "   ✅ SettingsScreen.ts → .tsx"

# 3. Corrigir API para porta 3000
echo "3️⃣ Corrigindo porta da API..."
if [ -f "src/services/api.ts" ]; then
    sed -i.bak 's|3001|3000|g' "src/services/api.ts"
    rm -f "src/services/api.ts.bak"
    echo "   ✅ API corrigida para porta 3000"
fi

echo ""
echo "✅ CORREÇÃO MÍNIMA CONCLUÍDA!"
echo ""
echo "🚀 AGORA TESTE:"
echo "   npm run dev"
echo ""
echo "💡 Se ainda houver erros, execute:"
echo "   ./scripts/fix-vite-menu.sh"
echo ""
echo "🎯 O mínimo foi feito para o Vite funcionar!"
