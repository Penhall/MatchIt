#!/bin/bash
# scripts/fix/fix_all_aliases.sh - Correção completa de todos os problemas de alias

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
ORANGE='\033[0;33m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}    🔧 CORREÇÃO COMPLETA DE ALIAS - MATCHIT    ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Criar backup
BACKUP_DIR="backup_aliases_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${BLUE}📦 Backup criado em: $BACKUP_DIR${NC}"

# Backup de arquivos críticos
[ -f "vite.config.ts" ] && cp "vite.config.ts" "$BACKUP_DIR/"
[ -f "tsconfig.json" ] && cp "tsconfig.json" "$BACKUP_DIR/"
[ -f "screens/LoginScreen.tsx" ] && cp "screens/LoginScreen.tsx" "$BACKUP_DIR/"

# =====================================================
# ETAPA 1: CORRIGIR VITE.CONFIG.TS
# =====================================================
echo -e "${YELLOW}🔧 ETAPA 1: Corrigindo vite.config.ts...${NC}"

cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@context': path.resolve(__dirname, './src/context'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@db': path.resolve(__dirname, './src/db')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['react-i18next', 'i18next']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
EOF

echo -e "${GREEN}✅ vite.config.ts corrigido${NC}"

# =====================================================
# ETAPA 2: CORRIGIR TSCONFIG.JSON
# =====================================================
echo -e "${YELLOW}🔧 ETAPA 2: Corrigindo tsconfig.json...${NC}"

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "allowJs": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@context/*": ["./src/context/*"],
      "@components/*": ["./src/components/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@assets/*": ["./src/assets/*"],
      "@db": ["./src/db"]
    },
    "typeRoots": ["./node_modules/@types", "./types"],
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts", 
    "**/*.tsx", 
    "**/*.js", 
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "backup_*"
  ]
}
EOF

echo -e "${GREEN}✅ tsconfig.json corrigido${NC}"

# =====================================================
# ETAPA 3: CRIAR ESTRUTURA DE DIRETÓRIOS
# =====================================================
echo -e "${YELLOW}🏗️ ETAPA 3: Criando estrutura de diretórios...${NC}"

# Criar todos os diretórios necessários
mkdir -p src/{components/common,context,services,types,utils,assets/images,db}
mkdir -p components/common
mkdir -p screens
mkdir -p types/recommendation

echo -e "${GREEN}✅ Estrutura de diretórios criada${NC}"

# =====================================================
# ETAPA 4: ORGANIZAR COMPONENTES
# =====================================================
echo -e "${YELLOW}📦 ETAPA 4: Organizando componentes...${NC}"

# Mover LoadingSpinner para local correto
if [ -f "src/components/LoadingSpinner.tsx" ]; then
    mv "src/components/LoadingSpinner.tsx" "src/components/common/"
    echo -e "${GREEN}✅ LoadingSpinner movido para src/components/common/${NC}"
fi

# Verificar se todos os componentes existem nos locais corretos
COMPONENTS=(
    "src/components/common/LoadingSpinner.tsx"
    "src/components/common/Button.tsx" 
    "src/components/common/FloatingLabelInput.tsx"
    "src/components/common/Icon.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ ! -f "$component" ]; then
        # Procurar o componente em outros locais
        component_name=$(basename "$component")
        found=false
        
        # Procurar em components/common/
        if [ -f "components/common/$component_name" ]; then
            cp "components/common/$component_name" "$component"
            echo -e "${GREEN}✅ $component_name copiado para $component${NC}"
            found=true
        fi
        
        # Se não encontrou, criar um básico
        if [ "$found" = false ]; then
            echo -e "${YELLOW}⚠️ Criando $component_name básico${NC}"
            
            case "$component_name" in
                "LoadingSpinner.tsx")
                    cat > "$component" << 'EOF'
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-blue-500',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <svg
        className={`animate-spin ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;
EOF
                    ;;
                "Button.tsx")
                    cat > "$component" << 'EOF'
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glowEffect,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700',
    outline: 'border border-gray-600 text-gray-200 hover:bg-gray-800/50'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
EOF
                    ;;
                "FloatingLabelInput.tsx")
                    cat > "$component" << 'EOF'
import React, { useState } from 'react';

interface FloatingLabelInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = value !== '' || isFocused;

  return (
    <div className={`relative ${className}`}>
      <label
        className={`absolute left-3 transition-all duration-200 ${
          shouldFloat 
            ? 'top-1 text-xs text-blue-500' 
            : 'top-3 text-gray-400'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full pt-5 pb-2 px-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:outline-none"
        required={required}
      />
    </div>
  );
};

export default FloatingLabelInput;
EOF
                    ;;
                "Icon.tsx")
                    cat > "$component" << 'EOF'
import React from 'react';

interface IconProps {
  className?: string;
}

export const GoogleIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
  </svg>
);

export const AppleIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 1.5c-.85 0-2.287.664-3.02 1.667-.85 1.17-.752 2.85.157 3.88 1.09-.01 2.242-.63 2.907-1.48.596-.77.95-1.92.956-3.067zM8.37 22.5c1.18 0 1.7-.82 3.16-.82 1.48 0 1.86.8 3.2.8 1.32 0 2.14-1.64 2.93-2.48.9-1.02 1.27-2.04 1.29-2.1-.03-.01-2.48-.96-2.5-3.8-.02-2.36 1.92-3.49 2.01-3.56-1.1-1.61-2.82-1.8-3.42-1.83-1.45-.15-2.83.86-3.57.86-.73 0-1.87-.84-3.07-.82-1.58.02-3.03.92-3.84 2.34-1.64 2.84-.42 7.04 1.17 9.34.78 1.13 1.71 2.4 2.93 2.35.02 0-.01.02 0 .01z"/>
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);
EOF
                    ;;
            esac
        fi
    fi
done

echo -e "${GREEN}✅ Componentes organizados${NC}"

# =====================================================
# ETAPA 5: CRIAR ARQUIVOS FALTANDO
# =====================================================
echo -e "${YELLOW}📄 ETAPA 5: Criando arquivos faltando...${NC}"

# Criar logo placeholder
if [ ! -f "src/assets/images/logo.png" ]; then
    echo -e "${BLUE}Criando logo placeholder...${NC}"
    # Criar um arquivo SVG como placeholder para logo
    cat > src/assets/images/logo.svg << 'EOF'
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#3B82F6"/>
  <text x="50" y="55" font-family="Arial" font-size="14" fill="white" text-anchor="middle">MatchIt</text>
</svg>
EOF
    echo -e "${GREEN}✅ Logo SVG criado (substitua por PNG real depois)${NC}"
fi

# Criar src/db/index.ts
if [ ! -f "src/db/index.ts" ]; then
    cat > src/db/index.ts << 'EOF'
// Database connection and utilities
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/matchit_db'
});

export { pool };
export default pool;
EOF
    echo -e "${GREEN}✅ src/db/index.ts criado${NC}"
fi

# Criar src/types/index.ts
if [ ! -f "src/types/index.ts" ]; then
    cat > src/types/index.ts << 'EOF'
// Main types for MatchIt application

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  city?: string;
  isVip?: boolean;
  bio?: string;
}

export interface StyleCategory {
  id: string;
  name: string;
  description?: string;
}

export interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}
EOF
    echo -e "${GREEN}✅ src/types/index.ts criado${NC}"
fi

# Criar src/utils/index.ts
if [ ! -f "src/utils/index.ts" ]; then
    mkdir -p src/utils
    cat > src/utils/index.ts << 'EOF'
// Utility functions for MatchIt

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
EOF
    echo -e "${GREEN}✅ src/utils/index.ts criado${NC}"
fi

echo -e "${GREEN}✅ Arquivos faltando criados${NC}"

# =====================================================
# ETAPA 6: CORRIGIR IMPORTS NO LOGINSCREEN
# =====================================================
echo -e "${YELLOW}🔄 ETAPA 6: Corrigindo imports no LoginScreen.tsx...${NC}"

if [ -f "screens/LoginScreen.tsx" ]; then
    cat > screens/LoginScreen.tsx << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@components/common/LoadingSpinner';
import Button from '@components/common/Button';
import FloatingLabelInput from '@components/common/FloatingLabelInput';
import { GoogleIcon, AppleIcon, SparklesIcon } from '@components/common/Icon';
import { APP_ROUTES } from '../constants';
import { useAuth } from '../src/context/AuthContext';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login, register, isLoggingIn, isRegistering, error, setError } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSignUp && password !== confirmPassword) {
      setError(t('login.passwordsDontMatch'));
      return;
    }

    try {
      if (isSignUp) {
        await register(email, password, email.split('@')[0]);
      } else {
        await login(email, password);
      }
      navigate(APP_ROUTES.PROFILE);
    } catch (err) {
      console.error('Auth error:', err);
      setError(t('login.authError'));
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gray-900 text-gray-200 relative overflow-hidden" 
         style={{ width: '100%', maxWidth: '420px', margin: '1rem auto' }}>
      
      {/* Background holographic/grid effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ffff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative z-10 w-full space-y-6 sm:space-y-8" 
           style={{ padding: '1rem', maxWidth: '90%' }}>
        
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-blue-500 mb-2" />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-500">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-gray-300 text-xs sm:text-sm">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-blue-500/20">
          
          <FloatingLabelInput
            label={t('login.email')}
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          
          <FloatingLabelInput
            label={t('login.password')}
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          
          {isSignUp && (
            <FloatingLabelInput
              label={t('login.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
          )}
          
          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoggingIn || isRegistering}
          >
            {(isLoggingIn || isRegistering) ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="sm" color="text-white" className="mr-2" />
                {isSignUp ? t('login.signingUp') : t('login.loggingIn')}
              </span>
            ) : (
              isSignUp ? t('login.signUp') : t('login.logIn')
            )}
          </Button>
          
          {/* Error Display */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm text-center">
              {error}
            </div>
          )}
        </form>

        {/* Toggle Sign Up/Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-500 hover:text-green-500 hover:underline transition-colors"
          >
            {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
          </button>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">{t('login.continueWith')}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="md" className="flex items-center justify-center">
              <GoogleIcon className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button variant="outline" size="md" className="flex items-center justify-center">
              <AppleIcon className="w-5 h-5 mr-2" />
              Apple
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
EOF
    echo -e "${GREEN}✅ LoginScreen.tsx corrigido${NC}"
fi

# =====================================================
# ETAPA 7: CORRIGIR OUTROS IMPORTS
# =====================================================
echo -e "${YELLOW}🔄 ETAPA 7: Corrigindo outros imports quebrados...${NC}"

# Corrigir BrandHeader.tsx se existir
if [ -f "components/common/BrandHeader.tsx" ]; then
    sed -i.bak "s|import logo from '@/assets/images/logo.png';|import logo from '@/assets/images/logo.svg';|g" "components/common/BrandHeader.tsx"
    rm -f "components/common/BrandHeader.tsx.bak"
    echo -e "${GREEN}✅ BrandHeader.tsx corrigido${NC}"
fi

# Corrigir recommendationRoutes.ts se existir
if [ -f "src/api/recommendationRoutes.ts" ]; then
    sed -i.bak "s|import { pool } from '@db';|import { pool } from '@db/index';|g" "src/api/recommendationRoutes.ts"
    rm -f "src/api/recommendationRoutes.ts.bak"
    echo -e "${GREEN}✅ recommendationRoutes.ts corrigido${NC}"
fi

# Corrigir extended-user.ts se existir
if [ -f "types/recommendation/extended-user.ts" ]; then
    sed -i.bak "s|import { User, StyleCategory } from '@/types.ts';|import { User, StyleCategory } from '@/types';|g" "types/recommendation/extended-user.ts"
    rm -f "types/recommendation/extended-user.ts.bak"
    echo -e "${GREEN}✅ extended-user.ts corrigido${NC}"
fi

echo -e "${GREEN}✅ Imports corrigidos${NC}"

# =====================================================
# ETAPA 8: VALIDAÇÃO FINAL
# =====================================================
echo -e "${YELLOW}✅ ETAPA 8: Validação final...${NC}"

echo -e "${BLUE}Verificando arquivos críticos:${NC}"

CRITICAL_FILES=(
    "src/components/common/LoadingSpinner.tsx"
    "src/components/common/Button.tsx"
    "src/components/common/FloatingLabelInput.tsx" 
    "src/components/common/Icon.tsx"
    "src/db/index.ts"
    "src/types/index.ts"
    "src/utils/index.ts"
    "vite.config.ts"
    "tsconfig.json"
)

all_good=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✅ $file${NC}"
    else
        echo -e "${RED}  ❌ $file${NC}"
        all_good=false
    fi
done

# =====================================================
# RESULTADO FINAL
# =====================================================
echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}    ✨ CORREÇÃO COMPLETA FINALIZADA!    ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

echo -e "${GREEN}🎯 Problemas Resolvidos:${NC}"
echo -e "${GREEN}  ✅ vite.config.ts com aliases corretos${NC}"
echo -e "${GREEN}  ✅ tsconfig.json com paths sincronizados${NC}"
echo -e "${GREEN}  ✅ Estrutura de diretórios criada${NC}"
echo -e "${GREEN}  ✅ Componentes organizados e criados${NC}"
echo -e "${GREEN}  ✅ Arquivos faltando criados${NC}"
echo -e "${GREEN}  ✅ Imports do LoginScreen corrigidos${NC}"
echo -e "${GREEN}  ✅ Outros imports problemáticos corrigidos${NC}"
echo ""

echo -e "${YELLOW}📋 Próximos Passos:${NC}"
echo -e "${BLUE}1.${NC} Testar o build:"
echo "   npm run build"
echo ""
echo -e "${BLUE}2.${NC} Se der sucesso, testar o dev:"
echo "   npm run dev"
echo ""
echo -e "${BLUE}3.${NC} Verificar se todos os alias funcionam:"
echo "   ./scripts/check-frontend-aliases.sh"
echo ""

echo -e "${GREEN}💡 Backup salvo em: ${BACKUP_DIR}${NC}"

if [ "$all_good" = true ]; then
    echo -e "${GREEN}${BOLD}🎉 Todos os alias devem estar funcionando agora!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Alguns arquivos podem precisar de atenção manual${NC}"
    exit 1
fi