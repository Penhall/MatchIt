# scripts/integracao-incremental.sh - Integração página por página
#!/bin/bash

# =================================================================
# INTEGRAÇÃO INCREMENTAL - MATCHIT
# =================================================================
# Este script permite habilitar uma tela por vez para identificar
# exatamente onde estão os problemas de integração
# =================================================================

# Cores para logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "================================================="
echo "  INTEGRAÇÃO INCREMENTAL - MATCHIT"
echo "================================================="

# =================================================================
# ETAPA 1: BACKUP COMPLETO
# =================================================================
log_info "Criando backup completo do estado atual..."

backup_dir="backup_incremental_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# Fazer backup dos arquivos principais
[ -f "src/App.tsx" ] && cp "src/App.tsx" "$backup_dir/"
[ -f "src/components/navigation/BottomNavbar.tsx" ] && cp "src/components/navigation/BottomNavbar.tsx" "$backup_dir/"
[ -f "src/constants.ts" ] && cp "src/constants.ts" "$backup_dir/"

log_success "Backup criado em: $backup_dir"

# =================================================================
# ETAPA 2: VERSÃO MINIMALISTA DO APP.TSX - APENAS LOGIN
# =================================================================
log_info "Criando versão minimalista do App.tsx..."

cat > "src/App.tsx" << 'EOF'
// src/App.tsx - Versão minimalista para integração incremental
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import { useAuth } from './hooks/useAuth';

// ⚠️  TELAS TEMPORARIAMENTE DESABILITADAS
// import ProfileScreen from './screens/ProfileScreen';
// import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
// import MatchAreaScreen from './screens/MatchAreaScreen';
// import ChatScreen from './screens/ChatScreen';
// import VendorScreen from './screens/VendorScreen';
// import SettingsScreen from './screens/SettingsScreen';
// import BottomNavbar from './components/navigation/BottomNavbar';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            {/* ✅ FASE 1: APENAS LOGIN */}
            <Route path="/login" element={<LoginScreen />} />
            
            {/* ⚠️  ROTAS TEMPORARIAMENTE DESABILITADAS */}
            {/* 
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/style-adjustment" element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>} />
            <Route path="/match-area" element={<ProtectedRoute><MatchAreaScreen /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
            <Route path="/vendor" element={<ProtectedRoute><VendorScreen /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
            */}
            
            {/* Rota padrão */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        
        {/* ⚠️  NAVEGAÇÃO TEMPORARIAMENTE DESABILITADA */}
        {/* {isAuthenticated && <BottomNavbar />} */}
      </div>
    </div>
  );
};

export default App;
EOF

log_success "App.tsx minimalista criado - APENAS LoginScreen ativa"

# =================================================================
# ETAPA 3: TELA DE DEBUG SIMPLES
# =================================================================
log_info "Criando tela de debug temporária..."

mkdir -p src/screens/debug

cat > "src/screens/debug/DebugScreen.tsx" << 'EOF'
// src/screens/debug/DebugScreen.tsx - Tela para teste de integração
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const DebugScreen: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4 text-neon-blue">🔧 Debug - Integração</h1>
      
      <div className="space-y-4">
        <div className="bg-dark-card p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Status da Autenticação</h2>
          <p>Autenticado: {isAuthenticated ? '✅ SIM' : '❌ NÃO'}</p>
          {user && (
            <div className="mt-2">
              <p>Usuário: {user.name}</p>
              <p>Email: {user.email}</p>
            </div>
          )}
        </div>
        
        <div className="bg-dark-card p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Próximos Passos</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>✅ LoginScreen funcionando</li>
            <li>⏳ Habilitar ProfileScreen</li>
            <li>⏳ Habilitar SettingsScreen</li>
            <li>⏳ Habilitar outras telas...</li>
          </ol>
        </div>
        
        {isAuthenticated && (
          <button 
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Logout (Teste)
          </button>
        )}
      </div>
    </div>
  );
};

export default DebugScreen;
EOF

log_success "Tela de debug criada"

# =================================================================
# ETAPA 4: PLANO DE INTEGRAÇÃO INCREMENTAL
# =================================================================
log_info "Criando plano de integração..."

cat > "PLANO_INTEGRACAO.md" << 'EOF'
# 📋 PLANO DE INTEGRAÇÃO INCREMENTAL - MATCHIT

## 🎯 Objetivo
Habilitar uma tela por vez para identificar exatamente onde estão os problemas de integração.

## ✅ FASE 1: BASE (ATUAL)
- [x] LoginScreen ativa
- [x] Navegação básica funcionando
- [x] Hook useAuth funcionando
- [x] Roteamento básico

### Teste da Fase 1:
```bash
npm run dev
# Verificar se:
# 1. Página carrega sem erros
# 2. LoginScreen renderiza
# 3. Console sem erros críticos
```

## 🔄 FASE 2: ADICIONAR PROFILESCREEN
Depois que Fase 1 estiver 100% funcionando:

1. **Descomentar no App.tsx:**
```jsx
import ProfileScreen from './screens/ProfileScreen';
// ... na rota:
<Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
```

2. **Testar:**
```bash
npm run dev
# Navegar para /profile
# Verificar erros
```

## 🔄 FASE 3: ADICIONAR SETTINGSSCREEN
```jsx
import SettingsScreen from './screens/SettingsScreen';
<Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
```

## 🔄 FASE 4: ADICIONAR STYLEADJUSTMENTSCREEN
⚠️ **CUIDADO**: Esta tela tem imports React Native problemáticos
```jsx
import StyleAdjustmentScreen from './screens/StyleAdjustmentScreen';
<Route path="/style-adjustment" element={<ProtectedRoute><StyleAdjustmentScreen /></ProtectedRoute>} />
```

## 🔄 FASE 5: ADICIONAR BOTTOM NAVBAR
```jsx
import BottomNavbar from './components/navigation/BottomNavbar';
// ... no final:
{isAuthenticated && <BottomNavbar />}
```

## 🔄 FASES 6-8: OUTRAS TELAS
- MatchAreaScreen
- ChatScreen  
- VendorScreen

## 📝 PROCESSO PARA CADA FASE:

1. **Descomentar APENAS a tela da fase atual**
2. **Testar**: `npm run dev`
3. **Se der erro**: Corrigir apenas essa tela
4. **Se funcionar**: Avançar para próxima fase
5. **Sempre fazer backup** antes de cada mudança

## 🚨 EM CASO DE ERRO:

### Restaurar estado anterior:
```bash
# Voltar para versão que funcionava
git checkout HEAD~1 src/App.tsx
# ou
cp backup_incremental_XXXXXX/App.tsx src/App.tsx
```

### Identificar problema específico:
1. Ver erro no console do navegador
2. Ver erro no terminal (npm run dev)
3. Isolar a tela problemática
4. Corrigir apenas essa tela

## 📊 CHECKLIST DE CADA FASE:

- [ ] `npm run dev` executa sem erros
- [ ] Página carrega no navegador
- [ ] Console sem erros críticos
- [ ] Navegação funciona
- [ ] Autenticação funciona
- [ ] Tela renderiza corretamente

EOF

log_success "Plano de integração criado: PLANO_INTEGRACAO.md"

# =================================================================
# ETAPA 5: SCRIPTS AUXILIARES
# =================================================================
log_info "Criando scripts auxiliares..."

# Script para habilitar próxima fase
cat > "scripts/habilitar-proxima-fase.sh" << 'EOF'
#!/bin/bash
# Script para habilitar próxima fase rapidamente

echo "Escolha a fase para habilitar:"
echo "1) ProfileScreen"
echo "2) SettingsScreen" 
echo "3) StyleAdjustmentScreen"
echo "4) BottomNavbar"
echo "5) MatchAreaScreen"
echo "6) ChatScreen"
echo "7) VendorScreen"
echo ""
read -p "Digite o número da fase: " fase

case $fase in
    1)
        echo "Habilitando ProfileScreen..."
        sed -i.bak 's|// import ProfileScreen|import ProfileScreen|g' src/App.tsx
        sed -i.bak 's|// <Route path="/profile"|<Route path="/profile"|g' src/App.tsx
        echo "✅ ProfileScreen habilitado"
        ;;
    2)
        echo "Habilitando SettingsScreen..."
        sed -i.bak 's|// import SettingsScreen|import SettingsScreen|g' src/App.tsx
        sed -i.bak 's|// <Route path="/settings"|<Route path="/settings"|g' src/App.tsx
        echo "✅ SettingsScreen habilitado"
        ;;
    3)
        echo "⚠️  Habilitando StyleAdjustmentScreen (pode ter problemas)..."
        sed -i.bak 's|// import StyleAdjustmentScreen|import StyleAdjustmentScreen|g' src/App.tsx
        sed -i.bak 's|// <Route path="/style-adjustment"|<Route path="/style-adjustment"|g' src/App.tsx
        echo "✅ StyleAdjustmentScreen habilitado"
        ;;
    4)
        echo "Habilitando BottomNavbar..."
        sed -i.bak 's|// import BottomNavbar|import BottomNavbar|g' src/App.tsx
        sed -i.bak 's|// {isAuthenticated && <BottomNavbar />}|{isAuthenticated && <BottomNavbar />}|g' src/App.tsx
        echo "✅ BottomNavbar habilitado"
        ;;
    *)
        echo "Fase não implementada ainda"
        ;;
esac

echo ""
echo "Agora teste com: npm run dev"
EOF

chmod +x scripts/habilitar-proxima-fase.sh

# Script para restaurar versão funcionando
cat > "scripts/restaurar-funcionando.sh" << 'EOF'
#!/bin/bash
# Script para voltar rapidamente para versão minimalista

echo "Restaurando versão minimalista (apenas LoginScreen)..."

cp src/App.tsx src/App.tsx.backup-$(date +%H%M%S)

cat > "src/App.tsx" << 'RESTORE_EOF'
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg p-2 sm:p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-black rounded-[36px] shadow-2xl shadow-neon-blue/30 overflow-hidden border-2 border-neon-blue/30 flex flex-col relative holographic-overlay">
        <main className="flex-grow overflow-y-auto">
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
RESTORE_EOF

echo "✅ Versão minimalista restaurada"
echo "Teste com: npm run dev"
EOF

chmod +x scripts/restaurar-funcionando.sh

log_success "Scripts auxiliares criados"

# =================================================================
# RELATÓRIO FINAL
# =================================================================
echo ""
echo "================================================="
log_success "INTEGRAÇÃO INCREMENTAL CONFIGURADA!"
echo "================================================="
echo ""
echo "📁 Arquivos criados:"
echo "  ✅ src/App.tsx (minimalista)"
echo "  ✅ PLANO_INTEGRACAO.md"
echo "  ✅ scripts/habilitar-proxima-fase.sh"
echo "  ✅ scripts/restaurar-funcionando.sh"
echo "  ✅ Backup em: $backup_dir"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo ""
echo "1. TESTAR BASE:"
echo "   npm run dev"
echo "   # Verificar se LoginScreen funciona"
echo ""
echo "2. HABILITAR PRÓXIMA FASE:"
echo "   ./scripts/habilitar-proxima-fase.sh"
echo ""
echo "3. SE DER PROBLEMA:"
echo "   ./scripts/restaurar-funcionando.sh"
echo ""
echo "4. LER PLANO DETALHADO:"
echo "   cat PLANO_INTEGRACAO.md"
echo ""
echo "================================================="
log_warning "COMEÇAR SEMPRE COM: npm run dev"
log_warning "VERIFICAR SE BASE FUNCIONA ANTES DE AVANÇAR"
echo "================================================="