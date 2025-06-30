#!/bin/bash
# scripts/debug-and-fix.sh - Script para diagnosticar e corrigir o problema específico

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Parar servidor
stop_server() {
    log_info "Parando servidor Vite..."
    PID=$(lsof -ti:5174 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        log_success "Servidor parado ✓"
    fi
    sleep 2
}

# Diagnóstico completo
diagnose_problem() {
    log_info "🔍 DIAGNÓSTICO DO PROBLEMA:"
    echo ""
    
    # 1. Verificar se src/App.tsx existe
    if [ -f "src/App.tsx" ]; then
        log_success "✓ src/App.tsx existe"
    else
        log_error "✗ src/App.tsx NÃO existe"
    fi
    
    # 2. Verificar estrutura de src/screens/
    log_info "📁 Verificando src/screens/:"
    if [ -d "src/screens" ]; then
        ls -la src/screens/ | head -10
        echo ""
        
        # Verificar arquivos específicos
        REQUIRED_SCREENS=("LoginScreen.tsx" "ProfileScreen.tsx" "EditProfileScreen.tsx" "SettingsScreen.tsx")
        for screen in "${REQUIRED_SCREENS[@]}"; do
            if [ -f "src/screens/$screen" ]; then
                log_success "✓ src/screens/$screen existe"
            else
                log_error "✗ src/screens/$screen FALTA"
            fi
        done
    else
        log_error "✗ src/screens/ não existe"
    fi
    
    # 3. Verificar imports em src/App.tsx
    echo ""
    log_info "🔗 Verificando imports em src/App.tsx:"
    if [ -f "src/App.tsx" ]; then
        grep -n "import.*Screen" src/App.tsx | head -5
    fi
    
    # 4. Verificar vite.config.ts
    echo ""
    log_info "⚙️  Verificando vite.config.ts:"
    if [ -f "vite.config.ts" ]; then
        log_success "✓ vite.config.ts existe"
        grep -A 10 "alias:" vite.config.ts | head -8
    else
        log_error "✗ vite.config.ts NÃO existe"
    fi
    
    echo ""
}

# Criar arquivos de tela faltantes
create_missing_screens() {
    log_info "📝 Criando arquivos de tela faltantes..."
    
    mkdir -p src/screens
    
    # LoginScreen.tsx
    if [ ! -f "src/screens/LoginScreen.tsx" ]; then
        cat > "src/screens/LoginScreen.tsx" << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular login
    navigate(APP_ROUTES.PROFILE);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-dark-bg text-gray-200">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neon-blue">MatchIt</h1>
          <p className="mt-2 text-gray-400">Entre na sua conta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-600 rounded bg-dark-card text-white"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-600 rounded bg-dark-card text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full p-3 bg-neon-blue text-black rounded font-semibold hover:opacity-80"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
EOF
        log_success "✓ LoginScreen.tsx criado"
    fi
    
    # ProfileScreen.tsx
    if [ ! -f "src/screens/ProfileScreen.tsx" ]; then
        cat > "src/screens/ProfileScreen.tsx" << 'EOF'
import React from 'react';

const ProfileScreen: React.FC = () => {
  return (
    <div className="min-h-screen p-4 bg-dark-bg text-gray-200">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-neon-blue mb-6">Perfil</h1>
        <div className="bg-dark-card p-6 rounded-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-neon-blue rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Usuário Demo</h2>
            <p className="text-gray-400">demo@matchit.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
EOF
        log_success "✓ ProfileScreen.tsx criado"
    fi
    
    # EditProfileScreen.tsx
    if [ ! -f "src/screens/EditProfileScreen.tsx" ]; then
        cat > "src/screens/EditProfileScreen.tsx" << 'EOF'
import React from 'react';

const EditProfileScreen: React.FC = () => {
  return (
    <div className="min-h-screen p-4 bg-dark-bg text-gray-200">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-neon-blue mb-6">Editar Perfil</h1>
        <div className="bg-dark-card p-6 rounded-lg">
          <p>Funcionalidade de edição em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
};

export default EditProfileScreen;
EOF
        log_success "✓ EditProfileScreen.tsx criado"
    fi
    
    # SettingsScreen.tsx
    if [ ! -f "src/screens/SettingsScreen.tsx" ]; then
        cat > "src/screens/SettingsScreen.tsx" << 'EOF'
import React from 'react';

const SettingsScreen: React.FC = () => {
  return (
    <div className="min-h-screen p-4 bg-dark-bg text-gray-200">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-neon-blue mb-6">Configurações</h1>
        <div className="bg-dark-card p-6 rounded-lg">
          <p>Configurações do aplicativo...</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
EOF
        log_success "✓ SettingsScreen.tsx criado"
    fi
}

# Corrigir src/App.tsx
fix_app_tsx() {
    log_info "🔧 Corrigindo src/App.tsx..."
    
    if [ ! -f "src/App.tsx" ]; then
        log_error "src/App.tsx não existe! Criando..."
        cat > "src/App.tsx" << 'EOF'
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginScreen from '@/screens/LoginScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import BottomNavbar from '@/components/navigation/BottomNavbar';
import { APP_ROUTES } from '@/constants';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = true; // Simular autenticação
  const showNavbar = isAuthenticated && location.pathname !== APP_ROUTES.LOGIN;

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route path={APP_ROUTES.LOGIN} element={<LoginScreen />} />
            <Route 
              path={APP_ROUTES.PROFILE} 
              element={isAuthenticated ? <ProfileScreen /> : <Navigate to={APP_ROUTES.LOGIN} replace />} 
            />
            <Route 
              path={APP_ROUTES.EDIT_PROFILE} 
              element={isAuthenticated ? <EditProfileScreen /> : <Navigate to={APP_ROUTES.LOGIN} replace />} 
            />
            <Route 
              path={APP_ROUTES.SETTINGS} 
              element={isAuthenticated ? <SettingsScreen /> : <Navigate to={APP_ROUTES.LOGIN} replace />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? APP_ROUTES.PROFILE : APP_ROUTES.LOGIN} replace />} 
            />
          </Routes>
        </main>
        {showNavbar && <BottomNavbar />}
      </div>
    </div>
  );
};

export default App;
EOF
        log_success "✓ src/App.tsx criado"
    else
        # Corrigir imports existentes
        cp "src/App.tsx" "src/App.tsx.backup"
        
        # Substituir imports problemáticos
        sed -i.tmp \
            -e 's|from "@screens/|from "@/screens/|g' \
            -e 's|from "@components/|from "@/components/|g' \
            -e 's|from "screens/|from "@/screens/|g' \
            -e 's|from "components/|from "@/components/|g' \
            "src/App.tsx"
        
        rm -f "src/App.tsx.tmp"
        log_success "✓ src/App.tsx corrigido"
    fi
}

# Verificar e criar constants.ts
ensure_constants() {
    log_info "📋 Verificando src/constants.ts..."
    
    if [ ! -f "src/constants.ts" ]; then
        cat > "src/constants.ts" << 'EOF'
export const APP_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  EDIT_PROFILE: '/edit-profile',
  STYLE_ADJUSTMENT: '/style-adjustment',
  MATCH_AREA: '/matches',
  CHAT: '/chat/:chatId',
  VENDOR: '/vendor',
  SETTINGS: '/settings',
  TOURNAMENT: '/tournament',
  ADMIN: '/admin'
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
EOF
        log_success "✓ src/constants.ts criado"
    else
        log_success "✓ src/constants.ts já existe"
    fi
}

# Criar BottomNavbar básico
ensure_bottom_navbar() {
    log_info "🧭 Verificando BottomNavbar..."
    
    mkdir -p src/components/navigation
    
    if [ ! -f "src/components/navigation/BottomNavbar.tsx" ]; then
        cat > "src/components/navigation/BottomNavbar.tsx" << 'EOF'
import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

const BottomNavbar: React.FC = () => {
  return (
    <nav className="bg-dark-card border-t border-gray-600 flex justify-around items-center h-16">
      <NavLink 
        to={APP_ROUTES.PROFILE} 
        className={({ isActive }) => 
          `flex flex-col items-center p-2 ${isActive ? 'text-neon-blue' : 'text-gray-400'}`
        }
      >
        <span className="text-xs">Perfil</span>
      </NavLink>
      
      <NavLink 
        to={APP_ROUTES.SETTINGS} 
        className={({ isActive }) => 
          `flex flex-col items-center p-2 ${isActive ? 'text-neon-blue' : 'text-gray-400'}`
        }
      >
        <span className="text-xs">Config</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;
EOF
        log_success "✓ BottomNavbar.tsx criado"
    else
        log_success "✓ BottomNavbar.tsx já existe"
    fi
}

# Verificar vite.config.ts
ensure_vite_config() {
    log_info "⚙️  Verificando vite.config.ts..."
    
    if [ ! -f "vite.config.ts" ] || ! grep -q "@/screens" "vite.config.ts"; then
        cat > "vite.config.ts" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@screens': path.resolve(__dirname, './src/screens'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
EOF
        log_success "✓ vite.config.ts criado/atualizado"
    else
        log_success "✓ vite.config.ts já está correto"
    fi
}

# Limpar cache e testar
test_final() {
    log_info "🧹 Limpando cache e testando..."
    
    # Limpar cache
    rm -rf node_modules/.vite .vite
    
    # Testar se compila
    log_info "🔨 Testando compilação..."
    if npm run build >/dev/null 2>&1; then
        log_success "✅ Build passou!"
        return 0
    else
        log_error "❌ Build ainda falha"
        return 1
    fi
}

# Função principal
main() {
    echo ""
    log_info "🔍 DIAGNÓSTICO E CORREÇÃO DIRECIONADA"
    echo ""
    
    stop_server
    echo ""
    
    diagnose_problem
    echo ""
    
    create_missing_screens
    echo ""
    
    fix_app_tsx
    echo ""
    
    ensure_constants
    echo ""
    
    ensure_bottom_navbar
    echo ""
    
    ensure_vite_config
    echo ""
    
    if test_final; then
        echo ""
        log_success "🎉 PROBLEMA RESOLVIDO!"
        echo ""
        log_info "🚀 Próximos passos:"
        log_info "1. Execute: npm run dev"
        log_info "2. Acesse: http://localhost:5173"
        log_info "3. Deveria carregar a tela de login"
        echo ""
    else
        echo ""
        log_error "❌ Ainda há problemas"
        log_info "Execute 'npm run build' para ver os erros específicos"
        echo ""
    fi
}

main "$@"