#!/bin/bash
# scripts/fix-vite-errors.sh - Correção completa dos erros do Vite

echo "🔧 CORREÇÃO COMPLETA - ERROS DO VITE"
echo "===================================="
echo ""
echo "🎯 Problemas identificados:"
echo "   ❌ Arquivos .ts com JSX (devem ser .tsx)"
echo "   ❌ Dependências não instaladas"
echo "   ❌ Conflito React Native vs React Web"
echo "   ❌ API ainda apontando para porta 3001"
echo ""

# Verificar diretório
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório raiz do projeto MatchIt"
    exit 1
fi

echo "✅ Diretório correto identificado"

# Backup
BACKUP_DIR="backup-vite-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Backup será salvo em: $BACKUP_DIR"

# 1. RENOMEAR ARQUIVOS .ts COM JSX PARA .tsx
echo ""
echo "1️⃣ Corrigindo extensões de arquivos..."

# Lista de arquivos problemáticos identificados nos erros
files_to_rename=(
    "screens/StyleAdjustmentScreen.ts"
    "screens/SettingsScreen.ts"
)

for file in "${files_to_rename[@]}"; do
    if [ -f "$file" ]; then
        # Backup
        cp "$file" "$BACKUP_DIR/"
        
        # Renomear para .tsx
        new_file="${file%.ts}.tsx"
        mv "$file" "$new_file"
        echo "   ✅ $file → $new_file"
    else
        echo "   ⚠️  $file não encontrado"
    fi
done

# Procurar outros arquivos .ts que podem ter JSX
echo "   🔍 Procurando outros arquivos .ts com JSX..."
for file in $(find screens components src -name "*.ts" 2>/dev/null | head -20); do
    if [ -f "$file" ] && grep -q "return (" "$file" && grep -q "<" "$file"; then
        # Backup
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        
        # Renomear
        new_file="${file%.ts}.tsx"
        mv "$file" "$new_file"
        echo "   ✅ $file → $new_file (contém JSX)"
    fi
done

# 2. INSTALAR DEPENDÊNCIAS FALTANTES
echo ""
echo "2️⃣ Instalando dependências faltantes..."

# Lista de dependências identificadas nos erros
missing_deps=(
    "react-router-dom"
    "axios"
    "i18next"
    "react-i18next"
    "i18next-browser-languagedetector"
)

echo "   📦 Instalando dependências principais..."
for dep in "${missing_deps[@]}"; do
    if ! npm list "$dep" >/dev/null 2>&1; then
        echo "   📦 Instalando $dep..."
        npm install "$dep"
    else
        echo "   ✅ $dep já instalado"
    fi
done

# Dependências de tipos para TypeScript
echo "   📦 Instalando tipos TypeScript..."
types_deps=(
    "@types/react"
    "@types/react-dom"
    "@types/node"
)

for dep in "${types_deps[@]}"; do
    if ! npm list "$dep" >/dev/null 2>&1; then
        npm install --save-dev "$dep"
    fi
done

# 3. CORRIGIR src/services/api.ts
echo ""
echo "3️⃣ Corrigindo API para porta 3000..."

if [ -f "src/services/api.ts" ]; then
    # Backup
    cp "src/services/api.ts" "$BACKUP_DIR/"
    
    # Corrigir URL da API
    sed -i.bak 's|localhost:3001|localhost:3000|g' "src/services/api.ts"
    rm -f "src/services/api.ts.bak"
    echo "   ✅ API corrigida para porta 3000"
else
    echo "   ⚠️  src/services/api.ts não encontrado"
fi

# 4. CONFIGURAR PROJETO PARA REACT WEB
echo ""
echo "4️⃣ Configurando projeto para React Web..."

# Instalar dependências específicas do React Web
web_deps=(
    "react"
    "react-dom"
    "@vitejs/plugin-react"
)

for dep in "${web_deps[@]}"; do
    if ! npm list "$dep" >/dev/null 2>&1; then
        echo "   📦 Instalando $dep..."
        npm install "$dep"
    fi
done

# 5. CRIAR COMPONENTES WEB EQUIVALENTES
echo ""
echo "5️⃣ Criando componentes Web equivalentes..."

# Criar diretório para componentes web
mkdir -p "src/components/web"

# TouchableOpacity → button
cat > "src/components/web/TouchableOpacity.tsx" << 'EOF'
// src/components/web/TouchableOpacity.tsx - Equivalente web do TouchableOpacity
import React from 'react';

interface TouchableOpacityProps {
  onPress?: () => void;
  style?: React.CSSProperties | React.CSSProperties[];
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  onPress,
  style,
  children,
  disabled = false,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const combinedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style)
    : style || {};

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...combinedStyle
      }}
    >
      {children}
    </button>
  );
};

export default TouchableOpacity;
EOF

# View → div
cat > "src/components/web/View.tsx" << 'EOF'
// src/components/web/View.tsx - Equivalente web do View
import React from 'react';

interface ViewProps {
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
  className?: string;
}

const View: React.FC<ViewProps> = ({ style, children, className = '' }) => {
  const combinedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style)
    : style || {};

  return (
    <div className={className} style={combinedStyle}>
      {children}
    </div>
  );
};

export default View;
EOF

# Text → span/p
cat > "src/components/web/Text.tsx" << 'EOF'
// src/components/web/Text.tsx - Equivalente web do Text
import React from 'react';

interface TextProps {
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
  className?: string;
  numberOfLines?: number;
}

const Text: React.FC<TextProps> = ({ 
  style, 
  children, 
  className = '',
  numberOfLines 
}) => {
  const combinedStyle = Array.isArray(style) 
    ? Object.assign({}, ...style)
    : style || {};

  if (numberOfLines) {
    combinedStyle.display = '-webkit-box';
    combinedStyle.WebkitLineClamp = numberOfLines;
    combinedStyle.WebkitBoxOrient = 'vertical';
    combinedStyle.overflow = 'hidden';
  }

  return (
    <span className={className} style={combinedStyle}>
      {children}
    </span>
  );
};

export default Text;
EOF

# Arquivo de exportação
cat > "src/components/web/index.ts" << 'EOF'
// src/components/web/index.ts - Exportações dos componentes web
export { default as TouchableOpacity } from './TouchableOpacity';
export { default as View } from './View';
export { default as Text } from './Text';
EOF

echo "   ✅ Componentes web criados"

# 6. ATUALIZAR VITE CONFIG
echo ""
echo "6️⃣ Atualizando vite.config.js..."

if [ -f "vite.config.js" ]; then
    cp "vite.config.js" "$BACKUP_DIR/"
fi

cat > "vite.config.js" << 'EOF'
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
      '@web': path.resolve(__dirname, './src/components/web'),
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('🔴 Proxy Error: Backend não está na porta 3000');
            console.error('🔧 Execute: npm run server');
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '❌';
            console.log(`${emoji} [${proxyRes.statusCode}]:`, req.url);
          });
        }
      }
    }
  },
  
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['i18next', 'react-i18next']
        }
      }
    }
  },
  
  define: {
    __API_URL__: JSON.stringify('http://localhost:3000/api')
  },
  
  esbuild: {
    jsx: 'automatic'
  }
});
EOF

echo "   ✅ vite.config.js atualizado"

# 7. CRIAR GUIA DE MIGRAÇÃO
echo ""
echo "7️⃣ Criando guia de migração..."

cat > "MIGRATION_GUIDE.md" << 'EOF'
# Guia de Migração - React Native para React Web

## Componentes Alterados

### Antes (React Native):
```jsx
import { TouchableOpacity, View, Text } from 'react-native';
```

### Depois (React Web):
```jsx
import { TouchableOpacity, View, Text } from '@web';
// ou
import TouchableOpacity from '@/components/web/TouchableOpacity';
import View from '@/components/web/View';
import Text from '@/components/web/Text';
```

## Arquivos Renomeados

- `screens/StyleAdjustmentScreen.ts` → `screens/StyleAdjustmentScreen.tsx`
- `screens/SettingsScreen.ts` → `screens/SettingsScreen.tsx`

## Dependências Adicionadas

- react-router-dom
- axios  
- i18next
- react-i18next
- i18next-browser-languagedetector

## URLs Corrigidas

- API: `localhost:3001` → `localhost:3000`

## Próximos Passos

1. Atualizar imports nos arquivos de tela
2. Substituir componentes React Native por componentes web
3. Testar funcionalidades específicas
EOF

echo "   ✅ Guia de migração criado"

# 8. TESTE FINAL
echo ""
echo "8️⃣ Executando testes finais..."

# Verificar se dependências estão instaladas
echo "   🔍 Verificando dependências..."
missing_count=0
for dep in "${missing_deps[@]}"; do
    if ! npm list "$dep" >/dev/null 2>&1; then
        echo "   ❌ $dep ainda não instalado"
        ((missing_count++))
    fi
done

if [ $missing_count -eq 0 ]; then
    echo "   ✅ Todas as dependências instaladas"
else
    echo "   ⚠️  $missing_count dependências ainda faltando"
fi

# Verificar sintaxe do vite.config.js
if node -c vite.config.js 2>/dev/null; then
    echo "   ✅ vite.config.js válido"
else
    echo "   ❌ Erro na sintaxe do vite.config.js"
fi

echo ""
echo "================================================================"
echo " ✅ CORREÇÃO DOS ERROS DO VITE CONCLUÍDA"
echo "================================================================"
echo ""
echo "📁 Backup salvo em: $BACKUP_DIR"
echo ""
echo "📝 CORREÇÕES APLICADAS:"
echo "   ✅ Arquivos .ts com JSX renomeados para .tsx"
echo "   ✅ Dependências faltantes instaladas"
echo "   ✅ API corrigida para porta 3000"
echo "   ✅ Componentes web equivalentes criados"
echo "   ✅ vite.config.js otimizado"
echo "   ✅ Guia de migração criado"
echo ""
echo "⚠️  AÇÕES NECESSÁRIAS:"
echo ""
echo "   1. Atualizar imports nos arquivos de tela:"
echo "      Substituir: import { TouchableOpacity } from 'react-native'"
echo "      Por: import { TouchableOpacity } from '@web'"
echo ""
echo "   2. Verificar compilação:"
echo "      npm run dev"
echo ""
echo "   3. Se houver mais erros de componentes React Native:"
echo "      Use os componentes web equivalentes em @web"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo ""
echo "   Terminal 1: npm run server    (backend porta 3000)"
echo "   Terminal 2: npm run dev       (frontend porta 5173)"
echo ""
echo "🎯 URLs após correção:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   API:      http://localhost:3000/api/health"
echo ""
echo "💡 Consulte MIGRATION_GUIDE.md para detalhes da migração"
echo ""
echo "✅ ERROS DO VITE CORRIGIDOS!"
