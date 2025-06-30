#!/bin/bash
# scripts/restore-original-structure.sh - Restaurar estrutura original do MatchIt baseada em docs/MatchIt-OLD

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

echo ""
log_info "🔄 RESTAURANDO ESTRUTURA ORIGINAL DO MATCHIT"
echo ""

# Parar servidor se estiver rodando
log_step "1. Parando servidor..."
pkill -f "vite" 2>/dev/null || true
sleep 2

# Backup da estrutura atual
log_step "2. Criando backup da estrutura atual..."
BACKUP_DIR="backup_before_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
[ -d "src" ] && cp -r "src" "$BACKUP_DIR/"
[ -f "index.html" ] && cp "index.html" "$BACKUP_DIR/"
log_success "Backup criado em: $BACKUP_DIR ✓"

# Limpar estrutura atual
log_step "3. Limpando estrutura atual..."
rm -rf src
rm -f index.html

# Criar estrutura original
log_step "4. Criando estrutura original completa..."

# 1. CONSTANTS.TS - Baseado no projeto original
mkdir -p src
cat > "src/constants.ts" << 'EOF'
export const APP_ROUTES = {
  LOGIN: '/login',
  PROFILE: '/profile',
  STYLE_ADJUSTMENT: '/style-adjustment',
  MATCH_AREA: '/match-area',
  CHAT: '/chat/:chatId',
  VENDOR: '/vendor',
  SETTINGS: '/settings',
};

export const NEON_COLORS = {
  blue: 'text-neon-blue', // #00FFFF
  green: 'text-neon-green', // #00FF00
  orange: 'text-neon-orange', // #FF8C00
};

export const COLORS = {
  NEON_BLUE: '#00FFFF',
  NEON_GREEN: '#39FF14', 
  NEON_ORANGE: '#FF8C00',
  DARK_BG: '#10101a',
  DARK_CARD: '#181824',
};
EOF

# 2. TYPES.TS - Baseado no original
cat > "src/types.ts" << 'EOF'
export interface User {
  id: string;
  displayName: string;
  city: string;
  gender: 'male' | 'female' | 'other';
  avatarUrl: string;
  bio?: string;
  isVip: boolean;
}

export interface StyleChoice {
  category: StyleCategory;
  value: number;
  preferenceImage?: string;
}

export enum StyleCategory {
  Sneakers = 'Sneakers',
  Clothing = 'Clothing',
  Colors = 'Colors',
  Hobbies = 'Hobbies',
  Feelings = 'Feelings',
}

export interface Match {
  id: string;
  user: User;
  compatibilityScore: number;
}

export interface IconProps {
  className?: string;
}
EOF

# 3. AUTHCONTEXT.TSX - Sistema de autenticação original
mkdir -p src/context
cat > "src/context/AuthContext.tsx" << 'EOF'
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('matchit_auth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('matchit_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
EOF

# 4. ÍCONES SVG - Baseado no original
mkdir -p src/components/common
cat > "src/components/common/Icon.tsx" << 'EOF'
import React from 'react';
import { IconProps } from '../../types';

export const UserIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const AdjustmentsIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h3.75" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

export const ChatBubbleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

export const ShoppingBagIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export const CogIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
EOF

# 5. COMPONENTES COMUNS - Button, Card
cat > "src/components/common/Button.tsx" << 'EOF'
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: 'blue' | 'green' | 'orange';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  glowEffect,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-neon-blue text-black hover:shadow-glow-blue',
    secondary: 'bg-neon-green text-black hover:shadow-glow-green',
    outline: 'border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };
  
  const glowClasses = glowEffect ? {
    blue: 'hover:shadow-glow-blue',
    green: 'hover:shadow-glow-green', 
    orange: 'hover:shadow-glow-orange'
  }[glowEffect] : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
EOF

cat > "src/components/common/Card.tsx" << 'EOF'
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  glowColor?: 'blue' | 'green' | 'orange';
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, glowColor, className = '' }) => {
  const baseClasses = 'bg-dark-card rounded-xl p-4 sm:p-6 border border-gray-700';
  
  const glowClasses = glowColor ? {
    blue: 'border-neon-blue/50 shadow-glow-blue',
    green: 'border-neon-green/50 shadow-glow-green',
    orange: 'border-neon-orange/50 shadow-glow-orange'
  }[glowColor] : '';

  return (
    <div className={`${baseClasses} ${glowClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
EOF

# 6. BOTTOM NAVBAR - Baseado no original
mkdir -p src/components/navigation
cat > "src/components/navigation/BottomNavbar.tsx" << 'EOF'
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../../constants';
import { UserIcon, AdjustmentsIcon, HeartIcon, ChatBubbleIcon, ShoppingBagIcon, CogIcon } from '../common/Icon';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === APP_ROUTES.CHAT && location.pathname.startsWith('/chat/'));

  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center justify-center flex-1 p-2 transition-all duration-200 hover:text-neon-blue ${
        isActive ? 'text-neon-blue scale-110' : 'text-gray-400'
      }`}
    >
      <div className={`mb-0.5 ${isActive ? 'animate-pulseGlow' : ''}`}>{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </NavLink>
  );
};

const BottomNavbar: React.FC = () => {
  return (
    <nav className="bg-dark-card/80 backdrop-blur-md border-t border-neon-blue/20 shadow-lg flex justify-around items-center h-16 sticky bottom-0 z-10 rounded-b-[34px]">
      <NavItem to={APP_ROUTES.PROFILE} icon={<UserIcon className="w-5 h-5" />} label="Profile" />
      <NavItem to={APP_ROUTES.STYLE_ADJUSTMENT} icon={<AdjustmentsIcon className="w-5 h-5" />} label="Style" />
      <NavItem to={APP_ROUTES.MATCH_AREA} icon={<HeartIcon className="w-5 h-5" />} label="Matches" />
      <NavItem to={APP_ROUTES.CHAT.replace(':chatId', 'global')} icon={<ChatBubbleIcon className="w-5 h-5" />} label="Chats" />
      <NavItem to={APP_ROUTES.VENDOR} icon={<ShoppingBagIcon className="w-5 h-5" />} label="Shop" />
      <NavItem to={APP_ROUTES.SETTINGS} icon={<CogIcon className="w-5 h-5" />} label="Settings" />
    </nav>
  );
};

export default BottomNavbar;
EOF

# 7. TELAS - LoginScreen baseado no original
mkdir -p src/screens
cat > "src/screens/LoginScreen.tsx" << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { APP_ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon } from '../components/common/Icon';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate(APP_ROUTES.PROFILE);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-200 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-blue mb-4 animate-pulseGlow" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            MatchIt
          </h1>
          <p className="text-gray-400 mt-2">Connect beyond the surface</p>
        </div>

        {/* Form */}
        <div className="bg-dark-card rounded-2xl p-8 border border-neon-blue/30 shadow-glow-blue">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" glowEffect="blue">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-neon-blue hover:text-neon-green transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
EOF

# 8. OUTRAS TELAS - ProfileScreen, SettingsScreen
cat > "src/screens/ProfileScreen.tsx" << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { APP_ROUTES, NEON_COLORS } from '../constants';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <Card glowColor="blue">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-neon-blue to-neon-green rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-black">
            AR
          </div>
          <h1 className="text-2xl font-bold text-neon-blue">Alex Ryder</h1>
          <p className="text-sm text-gray-400">Neo Kyoto | VIP Member</p>
          <p className="mt-4 text-sm text-gray-300">Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.</p>
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full" glowEffect="green">
          Edit Profile & Photos
        </Button>
      </Card>

      <Card glowColor="green">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.green} mb-2`}>Style Profile Progress</h2>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-neon-blue to-neon-green h-3 rounded-full" style={{width: '65%'}}></div>
        </div>
        <p className="text-sm text-gray-400 text-center">65% of your style profile completed.</p>
        <Button 
          variant="primary" 
          size="md" 
          className="mt-4 w-full" 
          onClick={() => navigate(APP_ROUTES.STYLE_ADJUSTMENT)}
          glowEffect="blue"
        >
          Adjust Your Style
        </Button>
      </Card>
    </div>
  );
};

export default ProfileScreen;
EOF

cat > "src/screens/SettingsScreen.tsx" << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CogIcon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES, NEON_COLORS } from '../constants';

const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(APP_ROUTES.LOGIN);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <div className="text-center mb-6">
        <CogIcon className={`w-12 h-12 mx-auto ${NEON_COLORS.blue} mb-2`} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
          Settings & Info
        </h1>
      </div>

      <Card glowColor="blue">
        <h2 className={`text-lg font-semibold ${NEON_COLORS.blue} mb-3`}>Account Options</h2>
        <div className="space-y-3">
          <Button variant="outline" glowEffect="blue" className="w-full">
            Edit Profile
          </Button>
          <Button variant="outline" glowEffect="green" className="w-full">
            Privacy Settings
          </Button>
          <Button variant="outline" glowEffect="orange" className="w-full">
            Notification Preferences
          </Button>
          <Button variant="secondary" glowEffect="orange" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsScreen;
EOF

# Criar telas placeholder para outras rotas
for screen in "StyleAdjustmentScreen" "MatchAreaScreen" "ChatScreen" "VendorScreen"; do
cat > "src/screens/${screen}.tsx" << EOF
import React from 'react';

const ${screen}: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="text-center text-gray-200">
        <h1 className="text-2xl font-bold text-neon-blue mb-4">${screen}</h1>
        <p className="text-gray-400">Feature coming soon...</p>
      </div>
    </div>
  );
};

export default ${screen};
EOF
done

# 9. APP.TSX - Baseado no original com design mobile
cat > "src/App.tsx" << 'EOF'
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
import MatchAreaScreen from './screens/MatchAreaScreen';
import ChatScreen from './screens/ChatScreen';
import VendorScreen from './screens/VendorScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNavbar from './components/navigation/BottomNavbar';
import { useAuth } from './context/AuthContext';
import { APP_ROUTES } from './constants';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            <Route path={APP_ROUTES.LOGIN} element={<LoginScreen />} />
            <Route
              path={APP_ROUTES.PROFILE}
              element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.STYLE_ADJUSTMENT}
              element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.MATCH_AREA}
              element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.CHAT}
              element={<ProtectedRoute><ChatScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.VENDOR}
              element={<ProtectedRoute><VendorScreen /></ProtectedRoute>}
            />
            <Route
              path={APP_ROUTES.SETTINGS}
              element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? APP_ROUTES.PROFILE : APP_ROUTES.LOGIN} replace />} />
          </Routes>
        </main>
        {isAuthenticated && <BottomNavbar />}
      </div>
    </div>
  );
};

export default App;
EOF

# 10. MAIN.TSX - Baseado no original
cat > "src/main.tsx" << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
EOF

# 11. INDEX.HTML - Baseado no original com Tailwind
cat > "index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MatchIt App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'dark-bg': '#10101a',
              'dark-card': '#181824',
              'dark-input': '#202030',
              'neon-blue': '#00FFFF',
              'neon-green': '#39FF14',
              'neon-orange': '#FF8C00',
            },
            boxShadow: {
              'neon-blue': '0 0 15px #00FFFF, 0 0 5px #00FFFF inset',
              'neon-green': '0 0 15px #39FF14, 0 0 5px #39FF14 inset',
              'neon-orange': '0 0 15px #FF8C00, 0 0 5px #FF8C00 inset',
              'glow-blue': '0 0 20px rgba(0, 255, 255, 0.7)',
              'glow-green': '0 0 20px rgba(57, 255, 20, 0.7)',
              'glow-orange': '0 0 20px rgba(255, 140, 0, 0.7)',
            },
            animation: {
              fadeIn: 'fadeIn 0.5s ease-in-out',
              pulseGlow: 'pulseGlow 1.5s infinite ease-in-out',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0', transform: 'translateY(10px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              pulseGlow: {
                '0%, 100%': { filter: 'drop-shadow(0 0 2px currentColor)' },
                '50%': { filter: 'drop-shadow(0 0 8px currentColor) drop-shadow(0 0 10px currentColor)' },
              }
            }
          },
        },
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# 12. INDEX.CSS - Baseado no original
cat > "src/index.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #10101a;
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
  background: linear-gradient(135deg, #10101a 0%, #1a1a2e 50%, #16213e 100%);
}

#root {
  width: 100%;
  min-height: 100vh;
}

/* Holographic overlay effect */
.holographic-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.05) 50%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}
EOF

# 13. VITE.CONFIG.TS - Simples e funcional
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

# Limpar cache
log_step "5. Limpando cache..."
rm -rf node_modules/.vite .vite dist

# Verificar estrutura final
log_step "6. Verificando estrutura restaurada..."
echo "📁 Estrutura restaurada:"
find src -type f -name "*.tsx" -o -name "*.ts" | head -15

# Testar build
log_step "7. Testando build..."
if npm run build; then
    log_success "✅ BUILD FUNCIONOU - ESTRUTURA ORIGINAL RESTAURADA!"
    echo ""
    log_info "🎨 CARACTERÍSTICAS RESTAURADAS:"
    log_info "✓ Design cyberpunk/neon original"
    log_info "✓ Layout mobile-first (420px container)"
    log_info "✓ 6 seções de navegação"
    log_info "✓ Sistema de autenticação com localStorage"
    log_info "✓ Componentes reutilizáveis (Button, Card, Icons)"
    log_info "✓ Animações e efeitos glow"
    echo ""
    log_info "🚀 EXECUTE: npm run dev"
    log_info "🎯 RESULTADO: Aplicação com visual cyberpunk profissional"
    echo ""
else
    log_warning "❌ Build falhou, mas estrutura foi restaurada"
    log_info "Execute 'npm run dev' para testar mesmo assim"
fi