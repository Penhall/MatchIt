#!/bin/bash
# scripts/quick-fix-vite-errors.sh - Correção rápida dos erros mais críticos

echo "⚡ CORREÇÃO RÁPIDA - ERROS CRÍTICOS DO VITE"
echo "=========================================="
echo ""
echo "🎯 Corrigindo apenas os erros que impedem o Vite de iniciar"
echo ""

# Verificar diretório
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório raiz do projeto"
    exit 1
fi

# 1. INSTALAR DEPENDÊNCIAS CRÍTICAS
echo "1️⃣ Instalando dependências críticas..."
critical_deps=(
    "react-router-dom"
    "axios"
    "i18next"
    "react-i18next"
    "i18next-browser-languagedetector"
)

for dep in "${critical_deps[@]}"; do
    echo "   📦 Instalando $dep..."
    npm install "$dep" --silent
done

echo "   ✅ Dependências críticas instaladas"

# 2. RENOMEAR ARQUIVOS PROBLEMÁTICOS
echo ""
echo "2️⃣ Renomeando arquivos .ts com JSX para .tsx..."

if [ -f "screens/StyleAdjustmentScreen.ts" ]; then
    mv "screens/StyleAdjustmentScreen.ts" "screens/StyleAdjustmentScreen.tsx"
    echo "   ✅ StyleAdjustmentScreen.ts → StyleAdjustmentScreen.tsx"
fi

if [ -f "screens/SettingsScreen.ts" ]; then
    mv "screens/SettingsScreen.ts" "screens/SettingsScreen.tsx"
    echo "   ✅ SettingsScreen.ts → SettingsScreen.tsx"
fi

# 3. CORRIGIR API PARA PORTA 3000
echo ""
echo "3️⃣ Corrigindo API para porta 3000..."

if [ -f "src/services/api.ts" ]; then
    sed -i.bak 's|localhost:3001|localhost:3000|g' "src/services/api.ts"
    rm -f "src/services/api.ts.bak"
    echo "   ✅ API corrigida para porta 3000"
fi

# 4. CRIAR COMPONENTES BÁSICOS PARA COMPATIBILIDADE
echo ""
echo "4️⃣ Criando componentes básicos para compatibilidade..."

mkdir -p "src/components/compat"

# TouchableOpacity simples
cat > "src/components/compat/TouchableOpacity.tsx" << 'EOF'
import React from 'react';

interface Props {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
}

const TouchableOpacity: React.FC<Props> = ({ onPress, style, children }) => (
  <button onClick={onPress} style={{ ...style, background: 'none', border: 'none', cursor: 'pointer' }}>
    {children}
  </button>
);

export default TouchableOpacity;
EOF

# View simples
cat > "src/components/compat/View.tsx" << 'EOF'
import React from 'react';

interface Props {
  style?: any;
  children?: React.ReactNode;
}

const View: React.FC<Props> = ({ style, children }) => (
  <div style={style}>{children}</div>
);

export default View;
EOF

echo "   ✅ Componentes de compatibilidade criados"

# 5. ATUALIZAR .ENV.LOCAL
echo ""
echo "5️⃣ Atualizando configuração..."

cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
EOF

echo "   ✅ Configuração atualizada"

echo ""
echo "================================================================"
echo " ⚡ CORREÇÃO RÁPIDA CONCLUÍDA"
echo "================================================================"
echo ""
echo "✅ CORREÇÕES APLICADAS:"
echo "   📦 Dependências críticas instaladas"
echo "   📝 Arquivos .ts→.tsx renomeados"
echo "   🔧 API corrigida para porta 3000"
echo "   🧩 Componentes de compatibilidade criados"
echo ""
echo "🚀 AGORA TESTE:"
echo "   npm run dev"
echo ""
echo "💡 Se ainda houver erros de componentes React Native:"
echo "   Use: import TouchableOpacity from '@/components/compat/TouchableOpacity'"
echo "   Use: import View from '@/components/compat/View'"
echo ""
echo "🎯 Se funcionar, acesse: http://localhost:5173"
echo ""
echo "⚡ Correção rápida finalizada!"
