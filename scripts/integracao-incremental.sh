# scripts/integracao-incremental.sh - Integração página por página
#!/bin/bash

# =================================================================
# INTEGRAÇÃO INCREMENTAL - MATCHIT
# =================================================================
# Estratégia: Começar com apenas LoginScreen e habilitar uma tela por vez
# Permite identificar exatamente onde estão os problemas

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

log_step() {
    echo -e "\n${YELLOW}[PASSO]${NC} $1"
}

# =================================================================
# BACKUP COMPLETO
# =================================================================
backup_current_state() {
    log_step "1. Fazendo backup completo do estado atual..."
    
    BACKUP_DIR="backup_incremental_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Fazer backup dos arquivos principais
    cp src/App.tsx "$BACKUP_DIR/"
    cp -r src/screens "$BACKUP_DIR/"
    cp -r src/components "$BACKUP_DIR/" 2>/dev/null || true
    cp -r src/hooks "$BACKUP_DIR/" 2>/dev/null || true
    cp src/constants.ts "$BACKUP_DIR/" 2>/dev/null || true
    
    log_success "Backup criado em: $BACKUP_DIR"
    echo "$BACKUP_DIR" > .ultimo_backup
}

# =================================================================
# CRIAR APP.TSX MINIMALISTA
# =================================================================
create_minimal_app() {
    log_step "2. Criando App.tsx minimalista (apenas LoginScreen)..."
    
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

    log_success "App.tsx minimalista criado"
}

# =================================================================
# CRIAR SCRIPTS AUXILIARES
# =================================================================
create_helper_scripts() {
    log_step "3. Criando scripts auxiliares..."
    
    # Script para habilitar próxima fase rapidamente
    cat > "scripts/habilitar-proxima-fase.sh" << 'HELPER_EOF'
#!/bin/bash
# Script para habilitar próxima tela rapidamente

echo "🚀 Habilitando próxima fase..."

# Verificar qual fase estamos
if grep -q "FASE 1: APENAS LOGIN" src/App.tsx; then
    echo "📱 Habilitando FASE 2: Login + Profile..."
    
    # Descomente ProfileScreen
    sed -i 's|// import ProfileScreen|import ProfileScreen|g' src/App.tsx
    sed -i 's|/\* <Route path="/profile"|<Route path="/profile"|g' src/App.tsx
    sed -i 's|element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} /> \*/|element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />|g' src/App.tsx
    
    echo "✅ Fase 2 habilitada. Teste com: npm run dev"
    
elif grep -q "FASE 2" src/App.tsx; then
    echo "📱 Habilitando FASE 3: + StyleAdjustment..."
    
    # Adicionar próxima tela...
    sed -i 's|// import StyleAdjustmentScreen|import StyleAdjustmentScreen|g' src/App.tsx
    # etc...
    
else
    echo "⚠️ Detectar fase atual e habilitar próxima"
fi
HELPER_EOF

    chmod +x scripts/habilitar-proxima-fase.sh
    
    # Script para restaurar versão funcionando
    cat > "scripts/restaurar-funcionando.sh" << 'RESTORE_EOF'
#!/bin/bash
# Script para voltar rapidamente para versão minimalista

echo "🔄 Restaurando versão minimalista (apenas LoginScreen)..."

cp src/App.tsx src/App.tsx.backup-$(date +%H%M%S)

cat > "src/App.tsx" << 'RESTORE_APP'
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
RESTORE_APP

echo "✅ Versão minimalista restaurada"
echo "Teste com: npm run dev"
RESTORE_EOF

    chmod +x scripts/restaurar-funcionando.sh
    
    log_success "Scripts auxiliares criados"
}

# =================================================================
# CRIAR PLANO DE INTEGRAÇÃO
# =================================================================
create_integration_plan() {
    log_step "4. Criando plano detalhado de integração..."
    
    cat > "PLANO_INTEGRACAO.md" << 'PLAN_EOF'
# 🎯 PLANO DE INTEGRAÇÃO INCREMENTAL - MATCHIT

## 📋 ESTRATÉGIA
Integrar uma tela por vez para identificar exatamente onde estão os problemas.

## 🔄 FASES DE INTEGRAÇÃO

### ✅ FASE 1: Base Funcional (ATUAL)
- **Telas:** Apenas LoginScreen
- **Status:** ✅ FUNCIONANDO
- **Teste:** `npm run dev` → Login deve funcionar

### 🎯 FASE 2: Perfil Básico
- **Adicionar:** ProfileScreen + ProtectedRoute
- **Comando:** `bash scripts/habilitar-proxima-fase.sh`
- **Teste:** Login → Redirect para Profile
- **Problemas esperados:** Hooks de autenticação, dados mockados

### 🎯 FASE 3: Ajuste de Estilo
- **Adicionar:** StyleAdjustmentScreen
- **Teste:** Navegação Profile → Style funciona
- **Problemas esperados:** Integração com BD de preferências

### 🎯 FASE 4: Área de Matches
- **Adicionar:** MatchAreaScreen
- **Teste:** Swipe de cards, matches
- **Problemas esperados:** API de matches, algoritmo

### 🎯 FASE 5: Chat
- **Adicionar:** ChatScreen
- **Teste:** Chat entre matches
- **Problemas esperados:** WebSocket, mensagens em tempo real

### 🎯 FASE 6: Loja/Vendor
- **Adicionar:** VendorScreen
- **Teste:** Produtos, compras
- **Problemas esperados:** Sistema de pagamento

### 🎯 FASE 7: Configurações
- **Adicionar:** SettingsScreen
- **Teste:** Configurações do usuário

### 🎯 FASE 8: Navegação Completa
- **Adicionar:** BottomNavbar
- **Teste:** Navegação entre todas as telas

## 🛠️ COMANDOS ÚTEIS

```bash
# Testar fase atual
npm run dev

# Habilitar próxima fase
bash scripts/habilitar-proxima-fase.sh

# Voltar para versão funcionando
bash scripts/restaurar-funcionando.sh

# Ver último backup
cat .ultimo_backup
```

## 🔍 PROCESSO DE DEBUG

Para cada fase:
1. **Habilitar** a próxima tela
2. **Testar** com `npm run dev`
3. **Se funcionar:** Continuar para próxima fase
4. **Se quebrar:** 
   - Examinar console de erros
   - Verificar imports/exports
   - Corrigir problemas específicos
   - Ou voltar com `restaurar-funcionando.sh`

## 📊 TRACKING DE PROBLEMAS

- [ ] **Fase 1:** ✅ Login funcionando
- [ ] **Fase 2:** Profile + Auth
- [ ] **Fase 3:** StyleAdjustment
- [ ] **Fase 4:** MatchArea
- [ ] **Fase 5:** Chat
- [ ] **Fase 6:** Vendor
- [ ] **Fase 7:** Settings
- [ ] **Fase 8:** BottomNavbar

PLAN_EOF

    log_success "Plano de integração criado: PLANO_INTEGRACAO.md"
}

# =================================================================
# EXECUTAR INTEGRAÇÃO
# =================================================================
main() {
    clear
    echo -e "${BLUE}"
    echo "================================================================="
    echo "🎯 INTEGRAÇÃO INCREMENTAL - MATCHIT"
    echo "================================================================="
    echo -e "${NC}"
    
    # Verificar se estamos no diretório correto
    if [[ ! -f "package.json" ]]; then
        log_error "Execute este script na raiz do projeto (onde está package.json)"
        exit 1
    fi
    
    # Criar diretório de scripts se não existir
    mkdir -p scripts
    
    # Executar passos
    backup_current_state
    create_minimal_app
    create_helper_scripts
    create_integration_plan
    
    echo -e "\n${GREEN}================================================================="
    echo "✅ INTEGRAÇÃO INCREMENTAL CONFIGURADA!"
    echo "=================================================================${NC}"
    
    echo -e "\n📋 ${YELLOW}PRÓXIMOS PASSOS:${NC}"
    echo "1. Testar versão atual: ${BLUE}npm run dev${NC}"
    echo "2. Ver plano completo: ${BLUE}cat PLANO_INTEGRACAO.md${NC}"
    echo "3. Habilitar próxima fase: ${BLUE}bash scripts/habilitar-proxima-fase.sh${NC}"
    echo "4. Se quebrar: ${BLUE}bash scripts/restaurar-funcionando.sh${NC}"
    
    echo -e "\n🎯 ${GREEN}Agora você pode integrar uma tela por vez com segurança!${NC}"
}

# Executar
main "$@"