# scripts/fix/frontend_complete_fix.sh - Script completo para corrigir problemas frontend MatchIt

#!/bin/bash
set -e

# =====================================================
# SCRIPT COMPLETO DE CORREÇÃO FRONTEND - MATCHIT
# =====================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}   🎨 MATCHIT - CORREÇÃO COMPLETA FRONTEND   ${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo ""

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto MatchIt${NC}"
    exit 1
fi

echo -e "${BLUE}Iniciando correção completa do frontend...${NC}"
echo ""

# =====================================================
# ETAPA 1: BACKUP E ESTRUTURA
# =====================================================
echo -e "${YELLOW}📦 ETAPA 1: Criando backup e organizando estrutura...${NC}"

# Criar diretório de backup
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup de arquivos críticos
echo -e "${BLUE}Criando backup...${NC}"
[ -f "screens/LoginScreen.tsx" ] && cp "screens/LoginScreen.tsx" "$BACKUP_DIR/"
[ -f "vite.config.ts" ] && cp "vite.config.ts" "$BACKUP_DIR/"
[ -f "src/i18n.ts" ] && cp "src/i18n.ts" "$BACKUP_DIR/"

# Organizar estrutura de componentes
echo -e "${BLUE}Organizando estrutura de componentes...${NC}"
mkdir -p src/components/{common,ui,forms}

# CORREÇÃO CRÍTICA: Mover LoadingSpinner para local correto
if [ -f "src/components/LoadingSpinner.tsx" ]; then
    if [ ! -f "src/components/common/LoadingSpinner.tsx" ]; then
        mv "src/components/LoadingSpinner.tsx" "src/components/common/"
        echo -e "${GREEN}✅ LoadingSpinner movido para src/components/common/${NC}"
    else
        echo -e "${YELLOW}⚠️ LoadingSpinner já existe em common/, removendo duplicata${NC}"
        rm "src/components/LoadingSpinner.tsx"
    fi
fi

# Garantir que o LoadingSpinner existe no local correto
if [ ! -f "src/components/common/LoadingSpinner.tsx" ]; then
    echo -e "${BLUE}Criando LoadingSpinner em src/components/common/...${NC}"
    cat > src/components/common/LoadingSpinner.tsx << 'EOF'
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'currentColor',
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
    echo -e "${GREEN}✅ LoadingSpinner criado em src/components/common/${NC}"
fi

echo -e "${GREEN}✅ Estrutura organizada${NC}"

# =====================================================
# ETAPA 2: CORREÇÃO DO VITE.CONFIG.TS
# =====================================================
echo -e "${YELLOW}⚙️ ETAPA 2: Corrigindo vite.config.ts...${NC}"

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
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    manifest: true,
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
    include: ['react', 'react-dom', 'react-router-dom', 'react-i18next']
  }
});
EOF

echo -e "${GREEN}✅ vite.config.ts corrigido${NC}"

# =====================================================
# ETAPA 3: RECONSTRUÇÃO DO LOGINSCREEN.TSX
# =====================================================
echo -e "${YELLOW}🔧 ETAPA 3: Reconstruindo LoginScreen.tsx...${NC}"

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
    <div className="min-h-full flex flex-col justify-center items-center p-4 sm:p-6 bg-dark-bg text-gray-200 relative overflow-hidden" 
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
      
      <div className="relative z-10 w-full space-y-6 sm:space-y-8 animate-fadeIn" 
           style={{ padding: '1rem', maxWidth: '90%' }}>
        
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-blue mb-2" />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-gray-300 text-xs sm:text-sm">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-dark-card/70 backdrop-blur-sm rounded-xl shadow-lg border border-neon-blue/20">
          
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
            glowEffect="blue"
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
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm text-center animate-fadeIn">
              {error}
            </div>
          )}
        </form>

        {/* Toggle Sign Up/Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-neon-blue hover:text-neon-green hover:underline transition-colors"
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

echo -e "${GREEN}✅ LoginScreen.tsx reconstruído${NC}"

# =====================================================
# ETAPA 4: VERIFICAÇÃO E ATUALIZAÇÃO DO I18N
# =====================================================
echo -e "${YELLOW}🌐 ETAPA 4: Verificando integração i18n...${NC}"

# Verificar se o arquivo de tradução existe e tem as chaves necessárias
if [ ! -f "src/locales/pt-BR.json" ]; then
    echo -e "${BLUE}Criando arquivo de tradução...${NC}"
    mkdir -p src/locales
    
    cat > src/locales/pt-BR.json << 'EOF'
{
  "login": {
    "title": "MatchIt",
    "subtitle": "Conecte-se através de estilo e emoção",
    "email": "Endereço de Email",
    "password": "Senha",
    "confirmPassword": "Confirmar Senha",
    "signUp": "Cadastrar",
    "logIn": "Entrar",
    "signingUp": "Cadastrando...",
    "loggingIn": "Entrando...",
    "alreadyHaveAccount": "Já tem uma conta? Entrar",
    "noAccount": "Não tem uma conta? Cadastrar",
    "continueWith": "Ou continue com",
    "authError": "Erro na autenticação. Verifique suas credenciais.",
    "invalidCredentials": "Email ou senha incorretos.",
    "passwordsDontMatch": "As senhas não coincidem.",
    "networkError": "Erro de conexão. Tente novamente.",
    "serverError": "Erro no servidor. Tente novamente mais tarde."
  }
}
EOF
    echo -e "${GREEN}✅ Arquivo de tradução criado${NC}"
fi

# Verificar configuração i18n
if [ ! -f "src/i18n.ts" ]; then
    echo -e "${BLUE}Criando configuração i18n...${NC}"
    
    cat > src/i18n.ts << 'EOF'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptBR from './locales/pt-BR.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        translation: ptBR
      }
    },
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
EOF
    echo -e "${GREEN}✅ Configuração i18n criada${NC}"
fi

echo -e "${GREEN}✅ Integração i18n verificada${NC}"

# =====================================================
# ETAPA 5: ATUALIZAÇÃO DE TIPOS E INTERFACES
# =====================================================
echo -e "${YELLOW}📝 ETAPA 5: Atualizando tipos TypeScript...${NC}"

# Criar arquivo de tipos para componentes se não existir
if [ ! -f "src/types/components.ts" ]; then
    mkdir -p src/types
    
    cat > src/types/components.ts << 'EOF'
export interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: string;
  className?: string;
}

export interface FloatingLabelInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}
EOF
    echo -e "${GREEN}✅ Tipos de componentes criados${NC}"
fi

echo -e "${GREEN}✅ Tipos TypeScript atualizados${NC}"

# =====================================================
# ETAPA 6: VERIFICAÇÃO FINAL E LIMPEZA
# =====================================================
echo -e "${YELLOW}🧹 ETAPA 6: Verificação final e limpeza...${NC}"

# Verificar se todos os arquivos críticos existem
CRITICAL_FILES=(
    "screens/LoginScreen.tsx"
    "src/components/common/FloatingLabelInput.tsx"
    "src/components/common/Button.tsx"
    "src/components/common/LoadingSpinner.tsx"
    "src/components/common/Icon.tsx"
    "src/context/AuthContext.tsx"
    "src/i18n.ts"
    "vite.config.ts"
)

echo -e "${BLUE}Verificando arquivos críticos...${NC}"
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
    fi
done

# =====================================================
# ETAPA 7: INSTRUÇÕES FINAIS
# =====================================================
echo ""
echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}   ✨ CORREÇÃO COMPLETA FINALIZADA!   ${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo ""

echo -e "${GREEN}🎯 Problemas Corrigidos:${NC}"
echo -e "${GREEN}  ✅ Path resolution corrigido${NC}"
echo -e "${GREEN}  ✅ Estrutura de arquivos organizada${NC}"
echo -e "${GREEN}  ✅ LoginScreen.tsx reconstruído${NC}"
echo -e "${GREEN}  ✅ Sistema i18n integrado${NC}"
echo -e "${GREEN}  ✅ Aliases Vite atualizados${NC}"
echo ""

echo -e "${YELLOW}📋 Próximos Passos:${NC}"
echo -e "${BLUE}1.${NC} Instalar dependências (se necessário):"
echo "   npm install react-i18next i18next i18next-browser-languagedetector"
echo ""
echo -e "${BLUE}2.${NC} Verificar se o arquivo index.tsx/main.tsx importa o i18n:"
echo "   import './src/i18n';"
echo ""
echo -e "${BLUE}3.${NC} Reiniciar o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo -e "${BLUE}4.${NC} Testar o login com dados inválidos para verificar tradução"
echo ""

echo -e "${GREEN}💡 Backup criado em: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}🎨 MatchIt frontend restaurado e otimizado!${NC}"
echo ""

exit 0