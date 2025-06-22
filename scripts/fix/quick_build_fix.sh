# scripts/fix/quick_build_fix.sh - Correção rápida do erro de build

#!/bin/bash

echo "🚀 CORREÇÃO RÁPIDA DO ERRO DE BUILD"
echo "❌ Problema: Rollup failed to resolve import '@context/AuthContext'"

# 1. Verificar onde está o AuthContext
echo "🔍 1/4 Localizando AuthContext..."
auth_location=""
if [ -f "src/context/AuthContext.tsx" ]; then
    auth_location="src/context/AuthContext.tsx"
    echo "✅ Encontrado em: src/context/AuthContext.tsx"
elif [ -f "context/AuthContext.tsx" ]; then
    auth_location="context/AuthContext.tsx"
    echo "✅ Encontrado em: context/AuthContext.tsx"
else
    echo "❌ AuthContext não encontrado - criando..."
    mkdir -p src/context
    cat > src/context/AuthContext.tsx << 'EOF'
import React, { createContext, useContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={{
      isAuthenticated: false,
      user: null,
      login: async () => {},
      logout: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
EOF
    auth_location="src/context/AuthContext.tsx"
    echo "✅ AuthContext criado"
fi

# 2. Corrigir SettingsScreen.tsx
echo "🔧 2/4 Corrigindo SettingsScreen.tsx..."
if [ -f "screens/SettingsScreen.tsx" ]; then
    cp screens/SettingsScreen.tsx screens/SettingsScreen.tsx.backup
    
    # Substituir import problemático
    sed -i 's|from ["'\'']\@context/AuthContext["'\'']|from "../src/context/AuthContext"|g' screens/SettingsScreen.tsx
    sed -i 's|from ["'\'']\@/context/AuthContext["'\'']|from "../src/context/AuthContext"|g' screens/SettingsScreen.tsx
    
    echo "✅ SettingsScreen.tsx corrigido"
else
    echo "⚠️  SettingsScreen.tsx não encontrado"
fi

# 3. Corrigir vite.config.ts
echo "🔧 3/4 Corrigindo vite.config.ts..."
if [ -f "vite.config.ts" ]; then
    cp vite.config.ts vite.config.ts.backup
    
    # Adicionar aliases se não existirem
    if ! grep -q "@context.*path.resolve" vite.config.ts; then
        sed -i '/alias: {/a\
      "@context": path.resolve(__dirname, "./src/context"),\
      "@screens": path.resolve(__dirname, "./screens"),' vite.config.ts
    fi
    
    echo "✅ Aliases adicionados ao vite.config.ts"
else
    echo "❌ vite.config.ts não encontrado"
fi

# 4. Testar build
echo "🧪 4/4 Testando build..."
if npm run build > /tmp/build_test.log 2>&1; then
    echo "✅ BUILD FUNCIONOU!"
    echo ""
    echo "🎉 PROBLEMA RESOLVIDO!"
    echo ""
    echo "Próximos passos:"
    echo "1. npm run preview"
    echo "2. curl http://localhost:4173/api/health"
else
    echo "❌ Build ainda falhou"
    echo "Últimos erros:"
    tail -3 /tmp/build_test.log
    echo ""
    echo "Execute o script completo:"
    echo "bash scripts/fix/fix_build_imports.sh"
fi

rm -f /tmp/build_test.log
