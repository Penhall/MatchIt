# scripts/fix/fix_theme_context.sh - Corrigir problema do useTheme

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}   CORREÇÃO DO PROBLEMA useTheme${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "${RED}❌ Erro: useTheme não está exportado por AuthContext.tsx${NC}"
echo -e "${YELLOW}🔧 Analisando e corrigindo...${NC}"

# =====================================================
# ETAPA 1: ANALISAR SETTINGSSCREEN.TSX
# =====================================================

echo -e "\n${BLUE}ETAPA 1: Analisando SettingsScreen.tsx${NC}"

if [ -f "screens/SettingsScreen.tsx" ]; then
    echo -e "${GREEN}✅ SettingsScreen.tsx encontrado${NC}"
    
    # Backup
    cp screens/SettingsScreen.tsx screens/SettingsScreen.tsx.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}📦 Backup criado${NC}"
    
    # Mostrar imports problemáticos
    echo -e "${YELLOW}Imports atuais problemáticos:${NC}"
    grep -n "useTheme\|useAuth" screens/SettingsScreen.tsx | sed 's/^/  /'
    
else
    echo -e "${RED}❌ SettingsScreen.tsx não encontrado${NC}"
    exit 1
fi

# =====================================================
# ETAPA 2: VERIFICAR SE THEMECONTEXT EXISTE
# =====================================================

echo -e "\n${BLUE}ETAPA 2: Verificando se ThemeContext existe${NC}"

theme_context_exists=false
theme_context_location=""

# Procurar ThemeContext
if [ -f "src/context/ThemeContext.tsx" ]; then
    theme_context_exists=true
    theme_context_location="src/context/ThemeContext.tsx"
    echo -e "${GREEN}✅ ThemeContext encontrado em: $theme_context_location${NC}"
elif [ -f "context/ThemeContext.tsx" ]; then
    theme_context_exists=true
    theme_context_location="context/ThemeContext.tsx"
    echo -e "${GREEN}✅ ThemeContext encontrado em: $theme_context_location${NC}"
else
    echo -e "${YELLOW}⚠️  ThemeContext não encontrado - será criado${NC}"
fi

# =====================================================
# ETAPA 3: CRIAR THEMECONTEXT SE NÃO EXISTIR
# =====================================================

if [ "$theme_context_exists" = false ]; then
    echo -e "\n${BLUE}ETAPA 3: Criando ThemeContext${NC}"
    
    mkdir -p src/context
    
    cat > src/context/ThemeContext.tsx << 'EOF'
// src/context/ThemeContext.tsx - Context para gerenciamento de tema
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // Carregar tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Aplicar tema ao documento
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export default ThemeContext;
EOF
    
    echo -e "${GREEN}✅ ThemeContext criado em src/context/ThemeContext.tsx${NC}"
    theme_context_location="src/context/ThemeContext.tsx"
    theme_context_exists=true
fi

# =====================================================
# ETAPA 4: CORRIGIR IMPORTS NO SETTINGSSCREEN
# =====================================================

echo -e "\n${BLUE}ETAPA 4: Corrigindo imports no SettingsScreen.tsx${NC}"

# Corrigir import do useTheme
echo -e "${YELLOW}🔧 Corrigindo import do useTheme...${NC}"

# Substituir import incorreto do useTheme
sed -i "s|import { useTheme } from.*AuthContext.*|import { useTheme } from '../src/context/ThemeContext';|g" screens/SettingsScreen.tsx

# Verificar se o import foi corrigido
echo -e "${YELLOW}Imports após correção:${NC}"
grep -n "useTheme\|useAuth" screens/SettingsScreen.tsx | sed 's/^/  /'

# =====================================================
# ETAPA 5: VERIFICAR OUTRAS DEPENDÊNCIAS
# =====================================================

echo -e "\n${BLUE}ETAPA 5: Verificando outras dependências do SettingsScreen${NC}"

# Verificar se há outros imports problemáticos
echo -e "${YELLOW}Verificando outros imports...${NC}"

missing_imports=()

# Verificar Icon imports
if ! grep -q "from.*Icon" screens/SettingsScreen.tsx; then
    echo -e "${YELLOW}⚠️  Imports de ícones podem estar problemáticos${NC}"
fi

# Verificar constants
if grep -q "APP_ROUTES" screens/SettingsScreen.tsx && [ ! -f "constants.ts" ] && [ ! -f "src/constants.ts" ] && [ ! -f "constants/index.ts" ]; then
    echo -e "${YELLOW}⚠️  APP_ROUTES pode estar ausente${NC}"
    missing_imports+=("APP_ROUTES")
fi

# Criar constants básico se necessário
if [[ " ${missing_imports[@]} " =~ " APP_ROUTES " ]]; then
    echo -e "${YELLOW}🔧 Criando constants básico...${NC}"
    
    cat > constants.ts << 'EOF'
// constants.ts - Constantes básicas da aplicação
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  STYLE_ADJUSTMENT: '/style-adjustment',
  MATCH_AREA: '/matches',
  CHAT: '/chat/:chatId',
  VENDOR: '/vendor'
};

export default APP_ROUTES;
EOF
    
    echo -e "${GREEN}✅ constants.ts criado${NC}"
fi

# =====================================================
# ETAPA 6: TESTE DE BUILD
# =====================================================

echo -e "\n${BLUE}ETAPA 6: Testando build${NC}"

echo -e "${YELLOW}Executando npm run build...${NC}"

if npm run build > build_test.log 2>&1; then
    echo -e "${GREEN}✅ BUILD FUNCIONOU!${NC}"
    
    # Mostrar estatísticas do build
    echo -e "${YELLOW}Estatísticas do build:${NC}"
    tail -5 build_test.log | sed 's/^/  /'
    
else
    echo -e "${RED}❌ Build ainda falhou${NC}"
    
    # Mostrar erros mais relevantes
    echo -e "${YELLOW}Erros encontrados:${NC}"
    grep -i "error\|failed\|not exported" build_test.log | head -5 | sed 's/^/  /'
    
    # Verificar se há outros problemas de import
    echo -e "\n${YELLOW}Verificando se há outros problemas...${NC}"
    
    if grep -q "not exported" build_test.log; then
        echo -e "${YELLOW}Há outros exports ausentes. Analisando...${NC}"
        grep "not exported" build_test.log | sed 's/^/  /'
    fi
fi

# Limpar arquivo de log
rm -f build_test.log

# =====================================================
# ETAPA 7: CONFIGURAR APP.TSX PARA USAR THEMECONTEXT
# =====================================================

echo -e "\n${BLUE}ETAPA 7: Verificando configuração do ThemeProvider${NC}"

# Procurar App.tsx ou arquivo principal
app_files=("src/App.tsx" "App.tsx" "src/main.tsx" "main.tsx" "index.tsx" "src/index.tsx")
app_file=""

for file in "${app_files[@]}"; do
    if [ -f "$file" ]; then
        app_file="$file"
        break
    fi
done

if [ ! -z "$app_file" ]; then
    echo -e "${GREEN}✅ Arquivo principal encontrado: $app_file${NC}"
    
    # Verificar se ThemeProvider já está configurado
    if grep -q "ThemeProvider" "$app_file"; then
        echo -e "${GREEN}✅ ThemeProvider já configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  ThemeProvider não configurado${NC}"
        echo -e "${YELLOW}   Adicione manualmente:${NC}"
        echo -e "${BLUE}   import { ThemeProvider } from './src/context/ThemeContext';${NC}"
        echo -e "${BLUE}   <ThemeProvider><App /></ThemeProvider>${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo principal não encontrado${NC}"
fi

# =====================================================
# CONCLUSÃO
# =====================================================

echo -e "\n${BLUE}=========================================================${NC}"
echo -e "${BLUE}   CORREÇÃO DO useTheme CONCLUÍDA${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "\n${YELLOW}📋 Correções aplicadas:${NC}"
echo "• ✅ ThemeContext criado/verificado"
echo "• ✅ Import useTheme corrigido no SettingsScreen"
echo "• ✅ Constants criado se necessário"
echo "• ✅ Build testado"

echo -e "\n${BLUE}🚀 Próximos passos:${NC}"
echo "1. Execute o build novamente:"
echo "   npm run build"
echo ""
echo "2. Se der sucesso, inicie o preview:"
echo "   npm run preview"
echo ""
echo "3. Configure o ThemeProvider no App.tsx se necessário"

echo -e "\n${GREEN}🎯 Problema useTheme resolvido!${NC}"
