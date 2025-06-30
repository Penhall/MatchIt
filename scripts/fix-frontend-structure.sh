#!/bin/bash
# scripts/fix-frontend-structure.sh - Script completo para correção da estrutura de arquivos e imports do frontend MatchIt

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependências necessárias
check_dependencies() {
    log_info "Verificando dependências..."
    
    if ! command_exists npm; then
        log_error "npm não encontrado. Instale Node.js primeiro."
        exit 1
    fi
    
    if ! command_exists node; then
        log_error "node não encontrado. Instale Node.js primeiro."
        exit 1
    fi
    
    log_success "Dependências verificadas ✓"
}

# Backup completo de segurança
create_comprehensive_backup() {
    log_step "Criando backup completo..."
    
    BACKUP_DIR="backup_complete_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de todos os arquivos importantes
    [ -d "src" ] && cp -r "src" "$BACKUP_DIR/"
    [ -d "components" ] && cp -r "components" "$BACKUP_DIR/"
    [ -d "screens" ] && cp -r "screens" "$BACKUP_DIR/"
    [ -f "vite.config.ts" ] && cp "vite.config.ts" "$BACKUP_DIR/"
    [ -f "tsconfig.json" ] && cp "tsconfig.json" "$BACKUP_DIR/"
    [ -f "index.html" ] && cp "index.html" "$BACKUP_DIR/"
    [ -f "package.json" ] && cp "package.json" "$BACKUP_DIR/"
    
    log_success "Backup completo criado em: $BACKUP_DIR ✓"
}

# Parar servidor de desenvolvimento
stop_dev_server() {
    log_step "Parando servidores de desenvolvimento..."
    
    # Matar processos nas portas comuns
    for port in 5173 3000 3001; do
        DEV_PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$DEV_PID" ]; then
            kill -9 $DEV_PID 2>/dev/null || true
            log_success "Processo na porta $port finalizado ✓"
        fi
    done
}

# Remover arquivos conflitantes
remove_conflicting_files() {
    log_step "Removendo arquivos conflitantes..."
    
    # Remover main.jsx se existir
    if [ -f "src/main.jsx" ]; then
        rm "src/main.jsx"
        log_success "Removido: src/main.jsx ✓"
    fi
    
    # Renomear App.jsx para StatusPage.jsx se existir
    if [ -f "src/App.jsx" ]; then
        mv "src/App.jsx" "src/StatusPage.jsx"
        log_success "Renomeado: src/App.jsx → src/StatusPage.jsx ✓"
    fi
    
    # Remover arquivos .ts que devem ser .tsx (que têm JSX)
    for file in "src/screens/StyleAdjustmentScreen.ts" "src/screens/SettingsScreen.ts"; do
        if [ -f "$file" ]; then
            mv "$file" "${file%%.ts}.tsx"
            log_success "Convertido: $file → ${file%%.ts}.tsx ✓"
        fi
    done
}

# Reorganizar estrutura de diretórios
reorganize_directory_structure() {
    log_step "Reorganizando estrutura de diretórios..."
    
    # Criar diretórios necessários
    mkdir -p src/components/navigation
    mkdir -p src/components/common
    mkdir -p src/context
    mkdir -p src/services
    mkdir -p src/hooks
    mkdir -p src/utils
    mkdir -p src/types
    mkdir -p src/screens
    
    # Mover componentes para src/components/
    if [ -d "components" ] && [ ! -d "src/components/navigation" ]; then
        log_info "Movendo components/ → src/components/"
        cp -r components/* src/components/ 2>/dev/null || true
        log_success "Componentes movidos ✓"
    fi
    
    # Mover BottomNavbar especificamente
    if [ -f "components/navigation/BottomNavbar.tsx" ]; then
        cp "components/navigation/BottomNavbar.tsx" "src/components/navigation/"
        log_success "BottomNavbar.tsx movido para src/components/navigation/ ✓"
    fi
    
    # Mover screens para src/screens/
    if [ -d "screens" ] && [ ! "$(ls -A src/screens 2>/dev/null)" ]; then
        log_info "Movendo screens/ → src/screens/"
        cp -r screens/* src/screens/ 2>/dev/null || true
        log_success "Screens movidos ✓"
    fi
}

# Limpar cache completamente
clear_all_cache() {
    log_step "Limpando todos os caches..."
    
    # Remover diretórios de cache
    [ -d "node_modules/.vite" ] && rm -rf "node_modules/.vite"
    [ -d ".vite" ] && rm -rf ".vite"
    [ -d "dist" ] && rm -rf "dist"
    [ -d ".next" ] && rm -rf ".next"
    [ -f ".eslintcache" ] && rm ".eslintcache"
    
    log_success "Cache limpo ✓"
}

# Corrigir src/main.tsx
fix_main_tsx() {
    log_step "Corrigindo src/main.tsx..."
    
    if [ ! -f "src/main.tsx" ]; then
        log_warning "src/main.tsx não existe. Criando..."
        
        cat > "src/main.tsx" << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF
        log_success "src/main.tsx criado ✓"
    else
        # Corrigir imports incorretos
        sed -i.bak 's/from "\.\/App\.jsx"/from "\.\/App"/g' "src/main.tsx" 2>/dev/null || true
        log_success "Imports corrigidos em src/main.tsx ✓"
    fi
}

# Criar vite.config.ts otimizado
create_optimized_vite_config() {
    log_step "Criando vite.config.ts otimizado..."
    
    cat > "vite.config.ts" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'], // TypeScript primeiro
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
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
EOF
    
    log_success "vite.config.ts otimizado criado ✓"
}

# Corrigir tsconfig.json
fix_tsconfig() {
    log_step "Corrigindo tsconfig.json..."
    
    cat > "tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@context/*": ["src/context/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
    
    log_success "tsconfig.json atualizado ✓"
}

# Corrigir index.html
fix_index_html() {
    log_step "Corrigindo index.html..."
    
    cat > "index.html" << 'EOF'
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MatchIt</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
    
    log_success "index.html corrigido ✓"
}

# Corrigir imports em App.tsx
fix_app_tsx_imports() {
    log_step "Corrigindo imports em src/App.tsx..."
    
    if [ -f "src/App.tsx" ]; then
        # Corrigir import do BottomNavbar
        sed -i.bak 's|from ".*components/navigation/BottomNavbar"|from "@components/navigation/BottomNavbar"|g' "src/App.tsx" 2>/dev/null || true
        
        # Corrigir outros imports comuns
        sed -i.bak 's|from ".*screens/|from "@screens/|g' "src/App.tsx" 2>/dev/null || true
        sed -i.bak 's|from ".*context/|from "@context/|g' "src/App.tsx" 2>/dev/null || true
        
        log_success "Imports corrigidos em src/App.tsx ✓"
    else
        log_warning "src/App.tsx não encontrado"
    fi
}

# Criar arquivos faltantes
create_missing_files() {
    log_step "Criando arquivos faltantes..."
    
    # Criar src/index.css se não existir
    if [ ! -f "src/index.css" ]; then
        cat > "src/index.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
EOF
        log_success "src/index.css criado ✓"
    fi
    
    # Criar constants.ts se não existir
    if [ ! -f "src/constants.ts" ]; then
        cat > "src/constants.ts" << 'EOF'
export const APP_ROUTES = {
  LOGIN: '/login',
  PROFILE: '/profile',
  STYLE_ADJUSTMENT: '/style-adjustment',
  MATCH_AREA: '/matches',
  CHAT: '/chat/:chatId',
  VENDOR: '/vendor',
  SETTINGS: '/settings'
};

export const API_BASE_URL = 'http://localhost:3000/api';
EOF
        log_success "src/constants.ts criado ✓"
    fi
}

# Instalar dependências necessárias
install_dependencies() {
    log_step "Instalando dependências necessárias..."
    
    # Verificar se package.json tem as dependências
    DEPS_TO_INSTALL=""
    
    if ! grep -q '"react-router-dom"' package.json; then
        DEPS_TO_INSTALL="$DEPS_TO_INSTALL react-router-dom"
    fi
    
    if ! grep -q '"axios"' package.json; then
        DEPS_TO_INSTALL="$DEPS_TO_INSTALL axios"
    fi
    
    if [ ! -z "$DEPS_TO_INSTALL" ]; then
        log_info "Instalando dependências faltantes: $DEPS_TO_INSTALL"
        npm install $DEPS_TO_INSTALL
        log_success "Dependências instaladas ✓"
    else
        log_info "Todas as dependências já estão instaladas"
    fi
}

# Verificar arquivos críticos
verify_critical_files() {
    log_step "Verificando arquivos críticos..."
    
    MISSING_FILES=""
    
    # Lista de arquivos críticos
    CRITICAL_FILES=(
        "src/main.tsx"
        "src/App.tsx"
        "index.html"
        "vite.config.ts"
        "tsconfig.json"
        "package.json"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            MISSING_FILES="$MISSING_FILES $file"
        fi
    done
    
    if [ ! -z "$MISSING_FILES" ]; then
        log_error "Arquivos críticos faltando: $MISSING_FILES"
        return 1
    else
        log_success "Todos os arquivos críticos encontrados ✓"
        return 0
    fi
}

# Testar build
test_build() {
    log_step "Testando build da aplicação..."
    
    # Limpar node_modules e reinstalar tudo limpo
    log_info "Reinstalando dependências..."
    rm -rf node_modules package-lock.json
    npm install
    
    # Tentar fazer build
    log_info "Executando build..."
    if npm run build; then
        log_success "Build realizado com sucesso ✓"
        return 0
    else
        log_error "Build falhou. Verificar erros acima."
        return 1
    fi
}

# Função principal
main() {
    echo ""
    log_info "🚀 Iniciando correção completa da estrutura do frontend MatchIt"
    echo ""
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado. Execute este script na raiz do projeto."
        exit 1
    fi
    
    # Executar todas as correções
    check_dependencies
    echo ""
    
    create_comprehensive_backup
    echo ""
    
    stop_dev_server
    echo ""
    
    remove_conflicting_files
    echo ""
    
    reorganize_directory_structure
    echo ""
    
    clear_all_cache
    echo ""
    
    fix_main_tsx
    echo ""
    
    create_optimized_vite_config
    echo ""
    
    fix_tsconfig
    echo ""
    
    fix_index_html
    echo ""
    
    fix_app_tsx_imports
    echo ""
    
    create_missing_files
    echo ""
    
    install_dependencies
    echo ""
    
    if verify_critical_files && test_build; then
        echo ""
        log_success "🎉 CORREÇÃO COMPLETA REALIZADA COM SUCESSO!"
        echo ""
        log_info "📋 Próximos passos:"
        log_info "1. Execute: npm run dev"
        log_info "2. Acesse: http://localhost:5173"
        log_info "3. Verifique se a aplicação carrega corretamente"
        echo ""
        log_info "📂 Estrutura reorganizada:"
        log_info "- Todos os componentes estão em src/components/"
        log_info "- Todas as telas estão em src/screens/"
        log_info "- Imports corrigidos com aliases @components, @screens, etc."
        log_info "- Cache limpo e dependências atualizadas"
        echo ""
        log_warning "⚠️  Se ainda houver erros específicos, compartilhe o output exato para correção direcionada."
    else
        echo ""
        log_error "❌ Correção não foi completamente bem-sucedida."
        log_info "Verifique os erros acima e tente novamente ou solicite ajuda específica."
    fi
    
    echo ""
}

# Executar função principal
main "$@"