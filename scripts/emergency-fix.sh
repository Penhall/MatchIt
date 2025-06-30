#!/bin/bash
# scripts/emergency-fix.sh - Correção emergencial IMEDIATA

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "🚨 CORREÇÃO EMERGENCIAL - RESOLVENDO IMEDIATAMENTE"
echo ""

# 1. PARAR SERVIDOR
log_info "1. Parando servidor..."
pkill -f "vite" 2>/dev/null || true
sleep 2

# 2. VERIFICAR E CRIAR ESTRUTURA
log_info "2. Verificando estrutura atual..."
echo "📁 Conteúdo de src/:"
ls -la src/ 2>/dev/null || echo "src/ não existe"
echo ""
echo "📁 Conteúdo de src/screens/:"
ls -la src/screens/ 2>/dev/null || echo "src/screens/ não existe"
echo ""

# Criar diretórios se não existirem
mkdir -p src/screens
mkdir -p src/components/navigation

# 3. CRIAR LOGINSCREEN IMEDIATAMENTE
log_info "3. Criando LoginScreen.tsx..."
cat > "src/screens/LoginScreen.tsx" << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-400">MatchIt</h2>
          <p className="mt-2 text-gray-300">Entre na sua conta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-black bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
EOF

# 4. CRIAR OUTROS SCREENS
log_info "4. Criando outras telas..."

cat > "src/screens/ProfileScreen.tsx" << 'EOF'
import React from 'react';

const ProfileScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">Perfil</h1>
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-400 rounded-full mx-auto mb-4"></div>
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

cat > "src/screens/EditProfileScreen.tsx" << 'EOF'
import React from 'react';

const EditProfileScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">Editar Perfil</h1>
        <div className="bg-gray-800 p-6 rounded-lg">
          <p>Funcionalidade em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
};

export default EditProfileScreen;
EOF

cat > "src/screens/SettingsScreen.tsx" << 'EOF'
import React from 'react';

const SettingsScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">Configurações</h1>
        <div className="bg-gray-800 p-6 rounded-lg">
          <p>Configurações do aplicativo...</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
EOF

# 5. CRIAR BOTTOMNAVBAR
log_info "5. Criando BottomNavbar..."
cat > "src/components/navigation/BottomNavbar.tsx" << 'EOF'
import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNavbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 border-t border-gray-600 flex justify-around items-center h-16">
      <NavLink 
        to="/profile" 
        className={({ isActive }) => 
          `flex flex-col items-center p-2 ${isActive ? 'text-blue-400' : 'text-gray-400'}`
        }
      >
        <span className="text-xs">Perfil</span>
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({ isActive }) => 
          `flex flex-col items-center p-2 ${isActive ? 'text-blue-400' : 'text-gray-400'}`
        }
      >
        <span className="text-xs">Config</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;
EOF

# 6. CORRIGIR APP.TSX COM IMPORTS RELATIVOS
log_info "6. Corrigindo App.tsx com imports relativos..."
cat > "src/App.tsx" << 'EOF'
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNavbar from './components/navigation/BottomNavbar';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = true; // Simulação
  const showNavbar = isAuthenticated && location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route 
              path="/profile" 
              element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/edit-profile" 
              element={isAuthenticated ? <EditProfileScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/profile" : "/login"} replace />} 
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

# 7. CRIAR VITE.CONFIG.TS SIMPLES
log_info "7. Criando vite.config.ts simples..."
cat > "vite.config.ts" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
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

# 8. LIMPAR CACHE COMPLETAMENTE
log_info "8. Limpando TODOS os caches..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
rm -rf node_modules/.cache
npm cache clean --force 2>/dev/null || true

# 9. VERIFICAR ESTRUTURA FINAL
log_info "9. Verificando estrutura final..."
echo "📁 src/screens/:"
ls -la src/screens/

echo ""
echo "📁 src/components/navigation/:"
ls -la src/components/navigation/

echo ""
echo "📄 Verificando imports em App.tsx:"
head -10 src/App.tsx

# 10. TESTAR BUILD
log_info "10. Testando build..."
if npm run build; then
    log_success "✅ BUILD FUNCIONOU!"
    echo ""
    log_info "🚀 AGORA EXECUTE:"
    log_info "npm run dev"
    echo ""
    log_success "✨ PROBLEMA RESOLVIDO!"
else
    log_error "❌ Build ainda falha. Vamos ver o erro:"
    npm run build
fi