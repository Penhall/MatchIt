#!/bin/bash
# scripts/fix-final-complete.sh - Script final para correção definitiva de toda a estrutura

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Backup completo
create_final_backup() {
    log_step "Criando backup final completo..."
    
    BACKUP_DIR="backup_final_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de TUDO
    [ -d "src" ] && cp -r "src" "$BACKUP_DIR/"
    [ -d "screens" ] && cp -r "screens" "$BACKUP_DIR/"
    [ -d "components" ] && cp -r "components" "$BACKUP_DIR/"
    [ -f "constants.ts" ] && cp "constants.ts" "$BACKUP_DIR/"
    [ -f "types.ts" ] && cp "types.ts" "$BACKUP_DIR/"
    [ -f "vite.config.ts" ] && cp "vite.config.ts" "$BACKUP_DIR/"
    [ -f "tsconfig.json" ] && cp "tsconfig.json" "$BACKUP_DIR/"
    
    log_success "Backup completo criado em: $BACKUP_DIR ✓"
}

# Parar todos os servidores
stop_all_servers() {
    log_step "Parando todos os servidores..."
    
    for port in 5173 3000 3001 4173; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
            log_success "Processo na porta $port finalizado ✓"
        fi
    done
}

# Limpar completamente
clean_everything() {
    log_step "Limpando todos os caches e arquivos temporários..."
    
    # Remover todos os caches
    rm -rf node_modules/.vite .vite dist .next .eslintcache .turbo
    
    # Remover arquivos temporários
    find . -name "*.backup" -delete 2>/dev/null || true
    find . -name "*.tmp" -delete 2>/dev/null || true
    
    log_success "Limpeza completa realizada ✓"
}

# Mover TODOS os arquivos definitivamente
move_all_files_final() {
    log_step "Movendo TODOS os arquivos para estrutura final..."
    
    # Criar estrutura completa
    mkdir -p src/{screens,components/{common,navigation},context,hooks,services,utils,types,assets}
    
    # MOVER SCREENS
    if [ -d "screens" ]; then
        log_info "Movendo screens/ → src/screens/"
        for file in screens/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                cp "$file" "src/screens/$filename"
                log_success "Movido: $file → src/screens/$filename ✓"
            fi
        done
        # Remover diretório original após copiar
        rm -rf screens
        log_success "Diretório screens/ removido ✓"
    fi
    
    # MOVER COMPONENTS
    if [ -d "components" ]; then
        log_info "Movendo components/ → src/components/"
        cp -r components/* src/components/ 2>/dev/null || true
        rm -rf components
        log_success "Components movidos e diretório original removido ✓"
    fi
    
    # MOVER ARQUIVOS DA RAIZ
    [ -f "constants.ts" ] && mv "constants.ts" "src/constants.ts" && log_success "constants.ts movido ✓"
    [ -f "types.ts" ] && mv "types.ts" "src/types.ts" && log_success "types.ts movido ✓"
    [ -f "utils.ts" ] && mv "utils.ts" "src/utils.ts" && log_success "utils.ts movido ✓"
}

# Corrigir TODOS os imports de uma vez
fix_all_imports_comprehensive() {
    log_step "Corrigindo TODOS os imports de forma abrangente..."
    
    # Encontrar e corrigir todos os arquivos TypeScript/JavaScript
    find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) | while read file; do
        log_info "Processando: $file"
        
        # Backup do arquivo
        cp "$file" "$file.backup"
        
        # Aplicar correções múltiplas
        sed -i.tmp \
            -e 's|from "\.\./screens/|from "@/screens/|g' \
            -e 's|from "\.\./components/|from "@/components/|g' \
            -e 's|from "\.\./constants"|from "@/constants"|g' \
            -e 's|from "\.\./types"|from "@/types"|g' \
            -e 's|from "\.\./utils"|from "@/utils"|g' \
            -e 's|from "\.\./context/|from "@/context/|g' \
            -e 's|from "\.\./hooks/|from "@/hooks/|g' \
            -e 's|from "\.\./services/|from "@/services/|g' \
            -e 's|from "\.\./src/components/|from "@/components/|g' \
            -e 's|from "\.\./src/context/|from "@/context/|g' \
            -e 's|from "\.\./src/hooks/|from "@/hooks/|g' \
            -e 's|from "\.\./src/utils/|from "@/utils/|g' \
            -e 's|from "\.\./src/services/|from "@/services/|g' \
            -e 's|from "\.\./\.\./constants"|from "@/constants"|g' \
            -e 's|from "\.\./\.\./types"|from "@/types"|g' \
            -e 's|from "\.\./\.\./utils"|from "@/utils"|g' \
            -e 's|from "\.\./\.\./components/|from "@/components/|g' \
            -e 's|from "\.\./\.\./screens/|from "@/screens/|g' \
            -e 's|from "\.\./\.\./context/|from "@/context/|g' \
            -e 's|from "\.\./\.\./hooks/|from "@/hooks/|g' \
            -e 's|from "\.\./\.\./services/|from "@/services/|g' \
            -e 's|from "screens/|from "@/screens/|g' \
            -e 's|from "components/|from "@/components/|g' \
            -e 's|from "context/|from "@/context/|g' \
            -e 's|from "hooks/|from "@/hooks/|g' \
            -e 's|from "utils/|from "@/utils/|g' \
            -e 's|from "services/|from "@/services/|g' \
            -e 's|from "constants"|from "@/constants"|g' \
            -e 's|from "types"|from "@/types"|g' \
            "$file"
        
        # Remover arquivo temporário
        rm -f "$file.tmp"
        
        log_success "Corrigido: $file ✓"
    done
}

# Criar arquivos essenciais completos
create_complete_essential_files() {
    log_step "Criando arquivos essenciais completos..."
    
    # src/constants.ts completo
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

export const THEME = {
  colors: {
    primary: '#00ffff',
    secondary: '#ff6b6b',
    background: '#1a1a1a',
    surface: '#2a2a2a'
  }
};
EOF
    
    # src/types.ts completo
    cat > "src/types.ts" << 'EOF'
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: StylePreference[];
}

export interface StylePreference {
  category: string;
  questionId: string;
  selectedOption: string;
  weight?: number;
}

export interface MatchProfile {
  id: string;
  user: User;
  compatibility: number;
  styles: StylePreference[];
  distance?: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}
EOF
    
    # src/index.css completo
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
  background-color: #1a1a1a;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
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

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 5px #00ffff; }
  50% { box-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}

.animate-pulseGlow {
  animation: pulseGlow 2s infinite;
}

/* Classes utilitárias personalizadas */
.text-neon-blue {
  color: #00ffff;
}

.bg-dark-bg {
  background-color: #1a1a1a;
}

.bg-dark-card {
  background-color: #2a2a2a;
}

.border-neon-blue {
  border-color: #00ffff;
}
EOF
    
    log_success "Arquivos essenciais criados ✓"
}

# Criar vite.config.ts definitivo
create_final_vite_config() {
    log_step "Criando vite.config.ts definitivo..."
    
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
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 30000
      }
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ]
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom']
        }
      }
    }
  }
})
EOF
    
    log_success "vite.config.ts definitivo criado ✓"
}

# Criar tsconfig.json definitivo
create_final_tsconfig() {
    log_step "Criando tsconfig.json definitivo..."
    
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
      "@assets/*": ["src/assets/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "screens",
    "components"
  ]
}
EOF
    
    log_success "tsconfig.json definitivo criado ✓"
}

# Verificar estrutura final completa
verify_final_structure() {
    log_step "Verificando estrutura final completa..."
    
    # Verificar arquivos críticos
    CRITICAL_FILES=(
        "src/main.tsx"
        "src/App.tsx"
        "src/constants.ts"
        "src/types.ts"
        "src/index.css"
        "vite.config.ts"
        "tsconfig.json"
        "index.html"
        "package.json"
    )
    
    # Verificar diretórios críticos
    CRITICAL_DIRS=(
        "src/screens"
        "src/components"
    )
    
    MISSING=""
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            MISSING="$MISSING $file"
        fi
    done
    
    for dir in "${CRITICAL_DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            MISSING="$MISSING $dir"
        fi
    done
    
    if [ -z "$MISSING" ]; then
        log_success "Estrutura final verificada com sucesso ✓"
        
        # Mostrar estrutura
        log_info "Estrutura final criada:"
        tree src 2>/dev/null || find src -type f | head -20
        
        return 0
    else
        log_error "Arquivos/diretórios faltando: $MISSING"
        return 1
    fi
}

# Instalar dependências e testar
install_and_test() {
    log_step "Instalando dependências e testando..."
    
    # Reinstalar tudo limpo
    log_info "Reinstalando dependências..."
    rm -rf node_modules package-lock.json
    npm install
    
    # Verificar dependências importantes
    DEPS_NEEDED="react-router-dom axios"
    for dep in $DEPS_NEEDED; do
        if ! npm list "$dep" >/dev/null 2>&1; then
            log_info "Instalando $dep..."
            npm install "$dep"
        fi
    done
    
    # Testar build
    log_info "Testando build final..."
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
    log_info "🚀 INICIANDO CORREÇÃO FINAL E DEFINITIVA DO FRONTEND MATCHIT"
    echo ""
    
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado. Execute na raiz do projeto."
        exit 1
    fi
    
    # Executar todas as etapas
    create_final_backup
    echo ""
    
    stop_all_servers
    echo ""
    
    clean_everything
    echo ""
    
    move_all_files_final
    echo ""
    
    fix_all_imports_comprehensive
    echo ""
    
    create_complete_essential_files
    echo ""
    
    create_final_vite_config
    echo ""
    
    create_final_tsconfig
    echo ""
    
    if verify_final_structure && install_and_test; then
        echo ""
        log_success "🎉 CORREÇÃO FINAL CONCLUÍDA COM SUCESSO TOTAL!"
        echo ""
        log_info "🎯 RESULTADO FINAL:"
        log_info "✅ Todos os arquivos movidos para src/"
        log_info "✅ Todos os imports corrigidos com aliases @/"
        log_info "✅ Configurações otimizadas criadas"
        log_info "✅ Build passou sem erros"
        log_info "✅ Estrutura completamente organizada"
        echo ""
        log_info "🚀 PRÓXIMOS PASSOS:"
        log_info "1. Execute: npm run dev"
        log_info "2. Acesse: http://localhost:5173"
        log_info "3. Verifique se a aplicação carrega perfeitamente"
        echo ""
        log_success "🎊 O FRONTEND ESTÁ 100% FUNCIONAL!"
        echo ""
    else
        echo ""
        log_error "❌ Ainda há problemas. Verifique os erros acima."
        log_info "💡 Se necessário, compartilhe o erro específico para ajuda direcionada."
        echo ""
    fi
}

# Executar
main "$@"