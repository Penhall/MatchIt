#!/bin/bash
# scripts/fix-imports-and-paths.sh - Script específico para corrigir imports quebrados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Backup rápido
create_backup() {
    log_info "Criando backup rápido..."
    BACKUP_DIR="backup_imports_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup apenas de arquivos que serão modificados
    [ -d "screens" ] && cp -r "screens" "$BACKUP_DIR/"
    [ -d "src" ] && cp -r "src" "$BACKUP_DIR/"
    [ -f "constants.ts" ] && cp "constants.ts" "$BACKUP_DIR/"
    
    log_success "Backup criado em: $BACKUP_DIR ✓"
}

# Mover arquivos restantes para src/
move_remaining_files() {
    log_info "Movendo arquivos restantes para src/..."
    
    # Garantir que diretórios existem
    mkdir -p src/screens
    mkdir -p src/components
    mkdir -p src/types
    
    # Mover todos os arquivos de screens/ para src/screens/
    if [ -d "screens" ]; then
        for file in screens/*.tsx screens/*.ts screens/*.jsx screens/*.js; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                mv "$file" "src/screens/$filename"
                log_success "Movido: $file → src/screens/$filename ✓"
            fi
        done
        
        # Remover diretório vazio se todos os arquivos foram movidos
        if [ -z "$(ls -A screens 2>/dev/null)" ]; then
            rmdir screens
            log_success "Diretório screens/ removido (vazio) ✓"
        fi
    fi
    
    # Mover constants.ts para src/ se estiver na raiz
    if [ -f "constants.ts" ]; then
        mv "constants.ts" "src/constants.ts"
        log_success "Movido: constants.ts → src/constants.ts ✓"
    fi
    
    # Mover types.ts para src/ se estiver na raiz
    if [ -f "types.ts" ]; then
        mv "types.ts" "src/types.ts"
        log_success "Movido: types.ts → src/types.ts ✓"
    fi
}

# Corrigir imports em todos os arquivos
fix_all_imports() {
    log_info "Corrigindo imports em todos os arquivos..."
    
    # Encontrar todos os arquivos TypeScript/JavaScript
    find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | while read file; do
        if [ -f "$file" ]; then
            log_info "Processando: $file"
            
            # Backup do arquivo
            cp "$file" "$file.backup"
            
            # Corrigir imports comuns
            sed -i.tmp \
                -e 's|from "\.\.\/constants"|from "@/constants"|g' \
                -e 's|from "\.\.\/types"|from "@/types"|g' \
                -e 's|from "\.\.\/utils"|from "@/utils"|g' \
                -e 's|from "\.\.\/services"|from "@/services"|g' \
                -e 's|from "\.\.\/context"|from "@/context"|g' \
                -e 's|from "\.\.\/hooks"|from "@/hooks"|g' \
                -e 's|from "\.\.\/components"|from "@/components"|g' \
                -e 's|from "\.\.\/screens"|from "@/screens"|g' \
                -e 's|from "\.\./\.\./constants"|from "@/constants"|g' \
                -e 's|from "\.\./\.\./types"|from "@/types"|g' \
                -e 's|from "\.\./\.\./utils"|from "@/utils"|g' \
                -e 's|from "\.\./\.\./services"|from "@/services"|g' \
                -e 's|from "\.\./\.\./context"|from "@/context"|g' \
                -e 's|from "\.\./\.\./hooks"|from "@/hooks"|g' \
                -e 's|from "\.\./\.\./components"|from "@/components"|g' \
                -e 's|from "\.\./\.\./screens"|from "@/screens"|g' \
                -e 's|from "components/|from "@/components/|g' \
                -e 's|from "screens/|from "@/screens/|g' \
                -e 's|from "context/|from "@/context/|g' \
                -e 's|from "hooks/|from "@/hooks/|g' \
                -e 's|from "utils/|from "@/utils/|g' \
                -e 's|from "services/|from "@/services/|g' \
                -e 's|from "types/|from "@/types/|g' \
                "$file"
            
            # Remover arquivo temporário
            rm -f "$file.tmp"
            
            log_success "Corrigido: $file ✓"
        fi
    done
}

# Verificar e criar arquivos essenciais
create_essential_files() {
    log_info "Verificando e criando arquivos essenciais..."
    
    # Criar src/constants.ts se não existir
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

export const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'userData',
  PREFERENCES: 'userPreferences'
};
EOF
        log_success "Criado: src/constants.ts ✓"
    fi
    
    # Criar src/types.ts se não existir
    if [ ! -f "src/types.ts" ]; then
        cat > "src/types.ts" << 'EOF'
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface StylePreference {
  category: string;
  value: string;
}

export interface MatchProfile {
  id: string;
  user: User;
  compatibility: number;
  styles: StylePreference[];
}
EOF
        log_success "Criado: src/types.ts ✓"
    fi
    
    # Verificar se src/index.css existe
    if [ ! -f "src/index.css" ]; then
        cat > "src/index.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
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
  text-align: center;
  width: 100%;
}
EOF
        log_success "Criado: src/index.css ✓"
    fi
}

# Atualizar vite.config.ts para resolver o problema
update_vite_config() {
    log_info "Atualizando vite.config.ts..."
    
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
      
      // Fallbacks para compatibilidade
      'constants': path.resolve(__dirname, './src/constants'),
      'types': path.resolve(__dirname, './src/types'),
      'utils': path.resolve(__dirname, './src/utils'),
      'components': path.resolve(__dirname, './src/components'),
      'screens': path.resolve(__dirname, './src/screens'),
      'context': path.resolve(__dirname, './src/context'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'services': path.resolve(__dirname, './src/services')
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
    
    log_success "vite.config.ts atualizado ✓"
}

# Atualizar tsconfig.json
update_tsconfig() {
    log_info "Atualizando tsconfig.json..."
    
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
    "strict": false,
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
      "@types/*": ["src/types/*"],
      "constants": ["src/constants"],
      "types": ["src/types"],
      "utils/*": ["src/utils/*"],
      "components/*": ["src/components/*"],
      "screens/*": ["src/screens/*"],
      "context/*": ["src/context/*"],
      "hooks/*": ["src/hooks/*"],
      "services/*": ["src/services/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "screens", "components"]
}
EOF
    
    log_success "tsconfig.json atualizado ✓"
}

# Verificar estrutura final
verify_structure() {
    log_info "Verificando estrutura final..."
    
    # Lista de arquivos/diretórios que devem existir
    REQUIRED_PATHS=(
        "src/main.tsx"
        "src/App.tsx"
        "src/constants.ts"
        "src/types.ts"
        "src/index.css"
        "src/screens"
        "src/components"
    )
    
    MISSING=""
    for path in "${REQUIRED_PATHS[@]}"; do
        if [ ! -e "$path" ]; then
            MISSING="$MISSING $path"
        fi
    done
    
    if [ -z "$MISSING" ]; then
        log_success "Estrutura verificada com sucesso ✓"
        return 0
    else
        log_error "Arquivos/diretórios faltando: $MISSING"
        return 1
    fi
}

# Limpar cache e testar build
test_final_build() {
    log_info "Testando build final..."
    
    # Limpar cache
    rm -rf node_modules/.vite .vite dist
    
    # Reinstalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Testar build
    if npm run build; then
        log_success "Build final realizado com sucesso ✓"
        return 0
    else
        log_error "Build final falhou"
        return 1
    fi
}

# Função principal
main() {
    echo ""
    log_info "🔧 Iniciando correção específica de imports e paths"
    echo ""
    
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado. Execute na raiz do projeto."
        exit 1
    fi
    
    create_backup
    echo ""
    
    move_remaining_files
    echo ""
    
    fix_all_imports
    echo ""
    
    create_essential_files
    echo ""
    
    update_vite_config
    echo ""
    
    update_tsconfig
    echo ""
    
    if verify_structure && test_final_build; then
        echo ""
        log_success "🎉 CORREÇÃO DE IMPORTS CONCLUÍDA COM SUCESSO!"
        echo ""
        log_info "📋 Próximos passos:"
        log_info "1. Execute: npm run dev"
        log_info "2. Acesse: http://localhost:5173"
        log_info "3. Verifique se a aplicação carrega sem erros"
        echo ""
        log_info "✅ Arquivos reorganizados:"
        log_info "- Todos os screens movidos para src/screens/"
        log_info "- Todos os imports corrigidos para usar aliases @/"
        log_info "- constants.ts e types.ts criados em src/"
        log_info "- Configurações atualizadas para resolver corretamente"
        echo ""
    else
        echo ""
        log_error "❌ Ainda há problemas com a estrutura ou build"
        log_info "Verifique os erros acima para detalhes específicos"
        echo ""
        log_info "💡 Dica: Se o erro persistir, compartilhe a mensagem exata para ajuda específica"
    fi
    
    echo ""
}

# Executar
main "$@"