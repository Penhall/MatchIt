#!/bin/bash
# scripts/enhance-ui.sh - Melhorar interface das telas

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

echo ""
log_info "🎨 MELHORANDO INTERFACE DO MATCHIT"
echo ""

# 1. Melhorar CSS base
log_step "1. Criando CSS aprimorado..."
cat > "src/index.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #0a0a0a;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

#root {
  width: 100%;
  min-height: 100vh;
}

/* Animações personalizadas */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff; }
  50% { box-shadow: 0 0 15px #00ffff, 0 0 25px #00ffff; }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.4s ease-out;
}

.animate-glow {
  animation: glow 2s infinite;
}

/* Gradientes personalizados */
.bg-gradient-main {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

.bg-gradient-card {
  background: linear-gradient(145deg, #1e1e2e, #2a2a3e);
}

.bg-gradient-neon {
  background: linear-gradient(45deg, #00ffff, #0080ff);
}

/* Classes utilitárias */
.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.neon-border {
  border: 1px solid #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.hover-scale {
  transition: transform 0.2s ease-in-out;
}

.hover-scale:hover {
  transform: scale(1.05);
}
EOF

# 2. Melhorar LoginScreen
log_step "2. Aprimorando LoginScreen..."
cat > "src/screens/LoginScreen.tsx" << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular delay de login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md animate-fadeIn">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-neon rounded-full mb-4 animate-glow">
            <span className="text-2xl font-bold text-black">M</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            MatchIt
          </h1>
          <p className="text-gray-400 mt-2">Encontre sua conexão perfeita</p>
        </div>

        {/* Card de Login */}
        <div className="glass-effect rounded-2xl p-8 animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-neon text-black rounded-lg font-semibold hover-scale transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Não tem uma conta?{' '}
              <button className="text-cyan-400 hover:text-cyan-300 font-medium">
                Registre-se
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 MatchIt. Conectando pessoas.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
EOF

# 3. Melhorar ProfileScreen
log_step "3. Aprimorando ProfileScreen..."
cat > "src/screens/ProfileScreen.tsx" << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Matches', value: '127' },
    { label: 'Conversas', value: '23' },
    { label: 'Curtidas', value: '892' },
  ];

  return (
    <div className="min-h-screen bg-gradient-main p-4 pb-20">
      <div className="max-w-md mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          <button 
            onClick={() => navigate('/edit-profile')}
            className="p-2 glass-effect rounded-lg hover-scale"
          >
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Card do Perfil */}
        <div className="glass-effect rounded-2xl p-6 mb-6 animate-slideUp">
          <div className="text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-neon rounded-full flex items-center justify-center text-2xl font-bold text-black">
                JD
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
            </div>
            
            <h2 className="text-xl font-semibold text-white">João Demo</h2>
            <p className="text-gray-400">joao@matchit.com</p>
            <p className="text-sm text-gray-500 mt-1">São Paulo, SP • 25 anos</p>
          </div>

          {/* Bio */}
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
            <p className="text-gray-300 text-sm">
              🎸 Músico nas horas vagas | 📚 Amante de livros | 🏃‍♂️ Corredor de fim de semana
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="glass-effect rounded-xl p-4 text-center animate-slideUp" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <button className="w-full glass-effect rounded-xl p-4 flex items-center justify-between hover-scale transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Matches</div>
                <div className="text-gray-400 text-sm">Ver suas conexões</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full glass-effect rounded-xl p-4 flex items-center justify-between hover-scale transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Estatísticas</div>
                <div className="text-gray-400 text-sm">Análise do seu perfil</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
EOF

# 4. Melhorar BottomNavbar
log_step "4. Aprimorando BottomNavbar..."
cat > "src/components/navigation/BottomNavbar.tsx" << 'EOF'
import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNavbar: React.FC = () => {
  const navItems = [
    {
      to: '/profile',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Perfil'
    },
    {
      to: '/matches',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      label: 'Matches'
    },
    {
      to: '/chat',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      label: 'Chat'
    },
    {
      to: '/settings',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Config'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-effect border-t border-gray-600/50 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center p-2 transition-all duration-200 ${
                isActive 
                  ? 'text-cyan-400 scale-110' 
                  : 'text-gray-400 hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`mb-1 ${isActive ? 'animate-glow' : ''}`}>
                  {item.icon(isActive)}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;
EOF

# 5. Criar tela de Matches
log_step "5. Criando tela de Matches..."
mkdir -p src/screens
cat > "src/screens/MatchesScreen.tsx" << 'EOF'
import React from 'react';

const MatchesScreen: React.FC = () => {
  const matches = [
    { id: 1, name: 'Ana Silva', age: 24, distance: '2 km', image: '👩‍🦱', compatibility: 92 },
    { id: 2, name: 'Carlos Mendes', age: 28, distance: '5 km', image: '👨‍💼', compatibility: 88 },
    { id: 3, name: 'Mariana Costa', age: 26, distance: '3 km', image: '👩‍🎨', compatibility: 85 },
  ];

  return (
    <div className="min-h-screen bg-gradient-main p-4 pb-20">
      <div className="max-w-md mx-auto animate-fadeIn">
        <h1 className="text-2xl font-bold text-white mb-8">Seus Matches</h1>
        
        <div className="space-y-4">
          {matches.map((match, index) => (
            <div 
              key={match.id} 
              className="glass-effect rounded-2xl p-4 hover-scale animate-slideUp"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-neon rounded-full flex items-center justify-center text-2xl">
                  {match.image}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold">{match.name}</h3>
                    <span className="text-cyan-400 text-sm font-bold">{match.compatibility}%</span>
                  </div>
                  <p className="text-gray-400 text-sm">{match.age} anos • {match.distance}</p>
                  
                  <div className="flex items-center mt-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-gradient-neon h-2 rounded-full" 
                        style={{width: `${match.compatibility}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 bg-cyan-400/20 rounded-lg hover:bg-cyan-400/30 transition-colors">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-white text-lg font-semibold mb-2">Nenhum match ainda</h3>
            <p className="text-gray-400">Continue navegando para encontrar sua conexão perfeita!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesScreen;
EOF

# 6. Atualizar App.tsx com nova rota
log_step "6. Atualizando App.tsx com tela de Matches..."
cat > "src/App.tsx" << 'EOF'
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import MatchesScreen from './screens/MatchesScreen';
import BottomNavbar from './components/navigation/BottomNavbar';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = true; // Simulação
  const showNavbar = isAuthenticated && location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-gradient-main">
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
              path="/matches" 
              element={isAuthenticated ? <MatchesScreen /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/chat" 
              element={isAuthenticated ? <div className="p-8 text-white text-center">Chat em desenvolvimento...</div> : <Navigate to="/login" replace />} 
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

log_success "✅ Interface melhorada com sucesso!"
echo ""
log_info "🎨 Melhorias aplicadas:"
log_info "✓ Design moderno com gradientes e efeitos glass"
log_info "✓ Animações suaves e responsivas"
log_info "✓ LoginScreen com loading state"
log_info "✓ ProfileScreen com estatísticas e ações"
log_info "✓ BottomNavbar com ícones SVG"
log_info "✓ Nova tela de Matches funcional"
log_info "✓ CSS aprimorado com temas neon"
echo ""
log_info "🚀 Execute 'npm run dev' para ver as melhorias!"