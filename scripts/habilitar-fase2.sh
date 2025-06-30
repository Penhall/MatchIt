# scripts/habilitar-fase2-corrigido.sh - Versão corrigida para extensões corretas
#!/bin/bash

# =================================================================
# FASE 2: HABILITAR PROFILESCREEN (VERSÃO CORRIGIDA)
# =================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo -e "${BLUE}"
echo "================================================================="
echo "🚀 HABILITANDO FASE 2: LOGIN + PROFILE (CORRIGIDO)"
echo "================================================================="
echo -e "${NC}"

# Backup do estado atual
log_info "Fazendo backup do App.tsx atual..."
cp src/App.tsx src/App.tsx.backup-fase1-$(date +%H%M%S)

# Verificar se existem arquivos necessários
log_info "Verificando dependências..."

# Lista de arquivos básicos obrigatórios
basic_files=(
    "src/screens/LoginScreen.tsx"
    "src/constants.ts"
)

# Verificar useAuth com múltiplas extensões possíveis
useauth_found=false
useauth_path=""
for ext in "tsx" "ts"; do
    if [[ -f "src/hooks/useAuth.$ext" ]]; then
        log_success "useAuth encontrado: src/hooks/useAuth.$ext"
        useauth_found=true
        useauth_path="src/hooks/useAuth.$ext"
        break
    fi
done

if [[ "$useauth_found" = false ]]; then
    log_error "Arquivo useAuth não encontrado!"
    log_info "Procurado em:"
    echo "  - src/hooks/useAuth.tsx"
    echo "  - src/hooks/useAuth.ts"
    exit 1
fi

# Verificar ProfileScreen
profilescreen_found=false
profilescreen_path=""
for path in "src/screens/ProfileScreen.tsx" "src/screens/ProfileScreen.ts"; do
    if [[ -f "$path" ]]; then
        log_success "ProfileScreen encontrado: $path"
        profilescreen_found=true
        profilescreen_path="$path"
        break
    fi
done

if [[ "$profilescreen_found" = false ]]; then
    log_error "ProfileScreen não encontrado!"
    log_info "Procurado em:"
    echo "  - src/screens/ProfileScreen.tsx"
    echo "  - src/screens/ProfileScreen.ts"
    exit 1
fi

# Verificar arquivos básicos
missing_files=()
for file in "${basic_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    log_error "Arquivos necessários não encontrados:"
    for file in "${missing_files[@]}"; do
        echo "  ❌ $file"
    done
    echo ""
    log_warning "Verifique se estes arquivos existem antes de continuar."
    exit 1
fi

log_success "Todos os arquivos necessários encontrados"

# Verificar se constants.ts tem APP_ROUTES
if ! grep -q "APP_ROUTES" src/constants.ts 2>/dev/null; then
    log_warning "APP_ROUTES não encontrado em constants.ts. Criando..."
    
    cat >> src/constants.ts << 'CONSTANTS_EOF'

export const APP_ROUTES = {
  LOGIN: '/login',
  PROFILE: '/profile',
  STYLE_ADJUSTMENT: '/style-adjustment',
  MATCH_AREA: '/match-area',
  CHAT: '/chat/:chatId',
  VENDOR: '/vendor',
  SETTINGS: '/settings',
};
CONSTANTS_EOF

    log_success "APP_ROUTES adicionado ao constants.ts"
fi

# Criar App.tsx com ProfileScreen habilitado
log_info "Habilitando ProfileScreen e ProtectedRoute..."

cat > "src/App.tsx" << 'EOF'
// src/App.tsx - FASE 2: Login + Profile
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import { useAuth } from './hooks/useAuth';
import { APP_ROUTES } from './constants';

// ⚠️  TELAS AINDA DESABILITADAS (FASE 3+)
// import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
// import MatchAreaScreen from './screens/MatchAreaScreen';
// import ChatScreen from './screens/ChatScreen';
// import VendorScreen from './screens/VendorScreen';
// import SettingsScreen from './screens/SettingsScreen';
// import BottomNavbar from './components/navigation/BottomNavbar';

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
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            {/* ✅ FASE 1: LOGIN */}
            <Route path="/login" element={<LoginScreen />} />
            
            {/* ✅ FASE 2: PROFILE */}
            <Route 
              path="/profile" 
              element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} 
            />
            
            {/* ⚠️  ROTAS AINDA DESABILITADAS (FASE 3+) */}
            {/* 
            <Route path="/style-adjustment" element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>} />
            <Route path="/match-area" element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
            <Route path="/vendor" element={<ProtectedRoute><VendorScreen /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
            */}
            
            {/* Rota padrão */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/profile" : "/login"} replace />} />
          </Routes>
        </main>
        
        {/* ⚠️  NAVEGAÇÃO AINDA DESABILITADA (FASE 8) */}
        {/* {isAuthenticated && <BottomNavbar />} */}
      </div>
    </div>
  );
};

export default App;
EOF

echo -e "\n${GREEN}================================================================="
echo "✅ FASE 2 HABILITADA COM SUCESSO!"
echo "=================================================================${NC}"

echo -e "\n📋 ${YELLOW}O QUE FOI HABILITADO:${NC}"
echo "  ✅ LoginScreen (já funcionava)"
echo "  ✅ ProfileScreen + ProtectedRoute"
echo "  ✅ Redirecionamento Login → Profile"
echo "  ✅ Verificações de arquivo corrigidas"
echo "  ⏳ Outras telas ainda desabilitadas"

echo -e "\n🔍 ${YELLOW}ARQUIVOS ENCONTRADOS:${NC}"
echo "  ✅ $useauth_path"
echo "  ✅ $profilescreen_path"
echo "  ✅ src/screens/LoginScreen.tsx"
echo "  ✅ src/constants.ts"

echo -e "\n🧪 ${YELLOW}TESTES A FAZER:${NC}"
echo "1. ${BLUE}npm run dev${NC} - Iniciar servidor"
echo "2. Fazer login normalmente"
echo "3. Verificar se redireciona para /profile"
echo "4. Verificar se ProfileScreen carrega sem erros"
echo "5. Testar proteção de rota (acessar /profile sem login)"

echo -e "\n🔧 ${YELLOW}SE DER ERRO:${NC}"
echo "  - Verificar console do navegador"
echo "  - Verificar se useAuth está funcionando"
echo "  - Verificar imports do ProfileScreen"
echo "  - Voltar para Fase 1: ${BLUE}bash scripts/restaurar-funcionando.sh${NC}"

echo -e "\n🎯 ${YELLOW}PRÓXIMA FASE:${NC}"
echo "  - Se tudo OK: Habilitar StyleAdjustmentScreen (Fase 3)"

echo -e "\n${GREEN}🚀 Teste agora com: npm run dev${NC}"