#!/bin/bash
# scripts/fix-frontend-resolution.sh - Script completo para correção do problema de resolução de módulos do frontend MatchIt

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Backup de arquivos importantes
create_backup() {
    log_info "Criando backup dos arquivos importantes..."
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de arquivos que serão modificados
    [ -f "src/main.jsx" ] && cp "src/main.jsx" "$BACKUP_DIR/"
    [ -f "src/App.jsx" ] && cp "src/App.jsx" "$BACKUP_DIR/"
    [ -f "src/main.tsx" ] && cp "src/main.tsx" "$BACKUP_DIR/"
    [ -f "vite.config.ts" ] && cp "vite.config.ts" "$BACKUP_DIR/"
    [ -f "index.html" ] && cp "index.html" "$BACKUP_DIR/"
    
    log_success "Backup criado em: $BACKUP_DIR ✓"
}

# Parar servidor de desenvolvimento se estiver rodando
stop_dev_server() {
    log_info "Parando servidor de desenvolvimento se estiver rodando..."
    
    # Encontrar e matar processos do Vite na porta 5173
    DEV_PID=$(lsof -ti:5173 2>/dev/null || true)
    if [ ! -z "$DEV_PID" ]; then
        kill -9 $DEV_PID 2>/dev/null || true
        log_success "Servidor de desenvolvimento parado ✓"
    else
        log_info "Nenhum servidor rodando na porta 5173"
    fi
}

# Remover arquivos conflitantes
remove_conflicting_files() {
    log_info "Removendo arquivos conflitantes..."
    
    # Remover main.jsx se existir
    if [ -f "src/main.jsx" ]; then
        rm "src/main.jsx"
        log_success "Removido: src/main.jsx ✓"
    else
        log_info "src/main.jsx não existe (OK)"
    fi
    
    # Renomear App.jsx para StatusPage.jsx se existir
    if [ -f "src/App.jsx" ]; then
        mv "src/App.jsx" "src/StatusPage.jsx"
        log_success "Renomeado: src/App.jsx → src/StatusPage.jsx ✓"
    else
        log_info "src/App.jsx não existe (OK)"
    fi
}

# Limpar cache do Vite completamente
clear_vite_cache() {
    log_info "Limpando cache do Vite..."
    
    # Remover diretórios de cache
    [ -d "node_modules/.vite" ] && rm -rf "node_modules/.vite"
    [ -d ".vite" ] && rm -rf ".vite"
    [ -d "dist" ] && rm -rf "dist"
    
    log_success "Cache do Vite limpo ✓"
}

# Verificar e corrigir src/main.tsx
fix_main_tsx() {
    log_info "Verificando e corrigindo src/main.tsx..."
    
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
        # Verificar se import está correto
        if grep -q "from './App.jsx'" "src/main.tsx"; then
            sed -i.bak "s/from '\.\/App\.jsx'/from '\.\/App'/g" "src/main.tsx"
            log_success "Import corrigido em src/main.tsx ✓"
        elif grep -q "from './App'" "src/main.tsx"; then
            log_success "Import já está correto em src/main.tsx ✓"
        else
            log_warning "Import em src/main.tsx pode estar incorreto. Verificar manualmente."
        fi
    fi
}

# Verificar e corrigir vite.config.ts
fix_vite_config() {
    log_info "Verificando vite.config.ts..."
    
    if [ ! -f "vite.config.ts" ]; then
        log_warning "vite.config.ts não existe. Criando configuração básica..."
        
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
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@screens': path.resolve(__dirname, './src/screens'),
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
    include: ['react', 'react-dom', 'react-router-dom', 'axios']
  }
})
EOF
        log_success "vite.config.ts criado ✓"
    else
        log_success "vite.config.ts já existe ✓"
    fi
}

# Verificar e corrigir index.html
fix_index_html() {
    log_info "Verificando index.html..."
    
    if [ ! -f "index.html" ]; then
        log_warning "index.html não existe. Criando..."
        
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
        log_success "index.html criado ✓"
    else
        # Verificar se aponta para main.tsx
        if grep -q "src/main.jsx" "index.html"; then
            sed -i.bak 's/src\/main\.jsx/src\/main.tsx/g' "index.html"
            log_success "index.html corrigido para apontar para main.tsx ✓"
        elif grep -q "src/main.tsx" "index.html"; then
            log_success "index.html já aponta para main.tsx ✓"
        else
            log_warning "Script de entrada não encontrado em index.html. Verificar manualmente."
        fi
    fi
}

# Reinstalar dependências limpo
reinstall_dependencies() {
    log_info "Reinstalando dependências..."
    
    # Remover node_modules e package-lock.json
    [ -d "node_modules" ] && rm -rf "node_modules"
    [ -f "package-lock.json" ] && rm "package-lock.json"
    
    # Instalar dependências
    npm install
    
    log_success "Dependências reinstaladas ✓"
}

# Verificar se App.tsx existe
check_app_tsx() {
    log_info "Verificando se App.tsx existe..."
    
    if [ ! -f "src/App.tsx" ]; then
        log_error "src/App.tsx não existe! Este arquivo é necessário."
        log_error "Por favor, verifique se o arquivo principal da aplicação existe."
        exit 1
    else
        log_success "src/App.tsx encontrado ✓"
    fi
}

# Testar se a correção funcionou
test_build() {
    log_info "Testando build da aplicação..."
    
    # Tentar fazer build
    if npm run build; then
        log_success "Build realizado com sucesso ✓"
        return 0
    else
        log_error "Build falhou. Verificar erros acima."
        return 1
    fi
}

# Iniciar servidor de desenvolvimento
start_dev_server() {
    log_info "Iniciando servidor de desenvolvimento..."
    log_info "Execute 'npm run dev' em outro terminal para testar a aplicação"
    log_info "A aplicação deve carregar em: http://localhost:5173"
    log_info "Verifique se a tela de login aparece em vez da página de status"
}

# Função principal
main() {
    echo ""
    log_info "🚀 Iniciando correção do problema de resolução do frontend MatchIt"
    echo ""
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado. Execute este script na raiz do projeto."
        exit 1
    fi
    
    # Executar correções
    check_dependencies
    echo ""
    
    create_backup
    echo ""
    
    stop_dev_server
    echo ""
    
    remove_conflicting_files
    echo ""
    
    clear_vite_cache
    echo ""
    
    fix_main_tsx
    echo ""
    
    fix_vite_config
    echo ""
    
    fix_index_html
    echo ""
    
    check_app_tsx
    echo ""
    
    reinstall_dependencies
    echo ""
    
    if test_build; then
        echo ""
        log_success "🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!"
        echo ""
        log_info "Próximos passos:"
        log_info "1. Execute: npm run dev"
        log_info "2. Acesse: http://localhost:5173"
        log_info "3. Verifique se a tela de login aparece"
        echo ""
        log_info "Se ainda houver problemas, verifique os logs do Vite para erros específicos."
    else
        echo ""
        log_error "❌ Build falhou. Correção não foi completamente bem-sucedida."
        log_info "Verifique os erros acima e corrija manualmente."
    fi
    
    echo ""
}

# Executar função principal
main "$@"