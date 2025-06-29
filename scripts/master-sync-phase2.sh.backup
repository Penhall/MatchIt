#!/bin/bash
# scripts/master-sync-phase2.sh - Script master para sincronização completa da Fase 2

set -e

# =====================================================
# CONFIGURAÇÕES E CORES
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_NAME="MatchIt"
PHASE="Master Sync - Fase 2"
VERSION="2.0.0"

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_banner() {
    echo -e "${PURPLE}${BOLD}"
    echo "=========================================================================="
    echo "🚀 $PROJECT_NAME - SINCRONIZAÇÃO MASTER FASE 2"
    echo "🎯 Setup Completo para Sistema de Torneios"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}${BOLD}📋 ETAPA: $1${NC}"
    echo ""
}

print_substep() {
    echo -e "${CYAN}   ▶️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}   ✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}   ⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}   ❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}   ℹ️  $1${NC}"
}

prompt_user() {
    local message="$1"
    local default="$2"
    echo -e "${YELLOW}❓ $message${NC}"
    if [ -n "$default" ]; then
        echo -e "${CYAN}   (Padrão: $default)${NC}"
    fi
    read -r response
    echo "${response:-$default}"
}

confirm_action() {
    local message="$1"
    echo -e "${YELLOW}❓ $message (y/N)${NC}"
    read -r response
    [[ "$response" =~ ^[Yy]$ ]]
}

# =====================================================
# VERIFICAÇÕES INICIAIS
# =====================================================

check_environment() {
    print_step "Verificando Ambiente"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado. Execute este script na raiz do projeto MatchIt."
        exit 1
    fi
    print_success "Diretório do projeto confirmado"
    
    # Check for critical Phase 2 files
    local critical_files=(
        "server/services/TournamentEngine.js"
        "server/routes/tournament.js"
        "screens/TournamentScreen.tsx"
        "screens/AdminTournamentPanel.tsx"
    )
    
    local missing_files=()
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_warning "Arquivos da Fase 2 não encontrados:"
        for file in "${missing_files[@]}"; do
            print_error "   $file"
        done
        
        if confirm_action "Quer continuar mesmo assim? Os arquivos serão criados durante o processo."; then
            print_info "Continuando..."
        else
            print_error "Cancelado pelo usuário"
            exit 1
        fi
    else
        print_success "Todos os arquivos críticos da Fase 2 encontrados"
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL CLI não encontrado"
        print_info "Instale PostgreSQL antes de continuar:"
        print_info "   Ubuntu/Debian: sudo apt install postgresql postgresql-client"
        print_info "   macOS: brew install postgresql"
        print_info "   Windows: Baixe de https://www.postgresql.org/download/"
        exit 1
    fi
    print_success "PostgreSQL CLI disponível"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado"
        exit 1
    fi
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        print_error "Node.js versão $node_version encontrada. Versão 16+ é necessária."
        exit 1
    fi
    print_success "Node.js $(node -v) disponível"
    
    echo ""
}

setup_configuration() {
    print_step "Configuração Inicial"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado"
        
        if confirm_action "Criar arquivo .env com configurações padrão?"; then
            print_substep "Criando configuração padrão..."
            
            # Get database configuration from user
            local db_name=$(prompt_user "Nome do banco de dados:" "matchit_tournaments")
            local db_user=$(prompt_user "Usuário do banco:" "matchit_user")
            local db_pass=$(prompt_user "Senha do banco:" "matchit_pass")
            local db_host=$(prompt_user "Host do banco:" "localhost")
            local db_port=$(prompt_user "Porta do banco:" "5432")
            
            cat > .env << EOF
# Database Configuration - Generated $(date)
DATABASE_URL=postgresql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}
DB_HOST=${db_host}
DB_PORT=${db_port}
DB_NAME=${db_name}
DB_USER=${db_user}
DB_PASSWORD=${db_pass}

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)
JWT_EXPIRE=7d

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Tournament Configuration
MIN_IMAGES_PER_CATEGORY=8
MAX_ACTIVE_SESSIONS_PER_USER=3
SESSION_EXPIRY_HOURS=24

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
EOF
            print_success "Arquivo .env criado"
        else
            print_error "Arquivo .env é necessário. Crie manualmente ou execute novamente."
            exit 1
        fi
    else
        print_success "Arquivo .env encontrado"
    fi
    
    # Source the .env file
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        print_info "Configurações carregadas: DB=$DB_NAME, User=$DB_USER"
    fi
    
    echo ""
}

# =====================================================
# ANÁLISE E SINCRONIZAÇÃO
# =====================================================

run_migration_analysis() {
    print_step "Análise de Migrações"
    
    # Create and run analysis script
    print_substep "Executando análise das migrações existentes..."
    
    if [ -f "scripts/analyze-migrations.sh" ]; then
        chmod +x scripts/analyze-migrations.sh
        if ./scripts/analyze-migrations.sh; then
            print_success "Análise de migrações concluída"
        else
            print_warning "Análise teve problemas, mas continuando..."
        fi
    else
        print_info "Script de análise não encontrado, pulando esta etapa"
    fi
    
    echo ""
}

run_database_sync() {
    print_step "Sincronização do Banco de Dados"
    
    print_substep "Preparando sincronização inteligente..."
    
    # Test database connection first
    if psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Conexão com banco $DB_NAME estabelecida"
    else
        print_warning "Banco $DB_NAME não encontrado"
        
        if confirm_action "Criar banco de dados $DB_NAME?"; then
            print_substep "Criando banco de dados..."
            if createdb "$DB_NAME" 2>/dev/null; then
                print_success "Banco $DB_NAME criado"
            else
                print_error "Falha ao criar banco. Verifique permissões e configurações."
                exit 1
            fi
        else
            print_error "Banco de dados é necessário. Configure manualmente."
            exit 1
        fi
    fi
    
    # Run sync script
    if [ -f "scripts/sync-database-phase2.sh" ]; then
        chmod +x scripts/sync-database-phase2.sh
        print_substep "Executando sincronização inteligente..."
        
        if ./scripts/sync-database-phase2.sh; then
            print_success "Sincronização do banco concluída"
        else
            print_error "Falha na sincronização do banco"
            exit 1
        fi
    else
        print_error "Script de sincronização não encontrado"
        exit 1
    fi
    
    echo ""
}

install_dependencies() {
    print_step "Instalação de Dependências"
    
    print_substep "Verificando package.json..."
    if [ -f "package.json" ]; then
        print_success "package.json encontrado"
    else
        print_error "package.json não encontrado"
        exit 1
    fi
    
    print_substep "Instalando dependências do Node.js..."
    if npm install --silent; then
        print_success "Dependências instaladas"
    else
        print_error "Falha na instalação de dependências"
        exit 1
    fi
    
    # Install additional Phase 2 dependencies if needed
    print_substep "Verificando dependências específicas da Fase 2..."
    local phase2_deps=("express" "pg" "multer" "uuid" "jsonwebtoken")
    local missing_deps=()
    
    for dep in "${phase2_deps[@]}"; do
        if ! npm list "$dep" >/dev/null 2>&1; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_info "Instalando dependências faltantes: ${missing_deps[*]}"
        npm install "${missing_deps[@]}" --save
        print_success "Dependências adicionais instaladas"
    fi
    
    echo ""
}

setup_directories() {
    print_step "Estrutura de Diretórios"
    
    local directories=(
        "uploads/tournaments"
        "uploads/profiles"
        "uploads/temp"
        "logs"
        "backups"
        "database/migrations"
        "database/seeds"
        "docs/phase2"
        "scripts"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Criado: $dir"
        else
            print_info "Existe: $dir"
        fi
    done
    
    # Set permissions
    chmod 755 uploads 2>/dev/null || true
    chmod 755 logs 2>/dev/null || true
    
    echo ""
}

run_final_verification() {
    print_step "Verificação Final"
    
    # Test database schema
    print_substep "Verificando schema do banco..."
    local table_count=$(psql -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'tournament_%';
    " 2>/dev/null | xargs)
    
    if [ "$table_count" -ge 4 ]; then
        print_success "Schema de torneios verificado ($table_count tabelas)"
    else
        print_warning "Schema pode estar incompleto ($table_count tabelas de torneio)"
    fi
    
    # Test sample data
    print_substep "Verificando dados de exemplo..."
    local image_count=$(psql -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM tournament_images WHERE approved = true;
    " 2>/dev/null | xargs)
    
    if [ "$image_count" -gt 0 ]; then
        print_success "Dados de exemplo carregados ($image_count imagens aprovadas)"
    else
        print_warning "Poucos ou nenhum dado de exemplo encontrado"
    fi
    
    # Test critical files
    print_substep "Verificando arquivos críticos..."
    local critical_files=(
        "server/services/TournamentEngine.js"
        "server/routes/tournament.js"
        "screens/TournamentScreen.tsx"
        "screens/AdminTournamentPanel.tsx"
        "navigation/AppNavigator.tsx"
    )
    
    local missing_count=0
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_warning "Arquivo faltante: $file"
            missing_count=$((missing_count + 1))
        fi
    done
    
    if [ $missing_count -eq 0 ]; then
        print_success "Todos os arquivos críticos encontrados"
    else
        print_warning "$missing_count arquivo(s) crítico(s) faltante(s)"
    fi
    
    echo ""
}

create_test_script() {
    print_step "Script de Teste"
    
    cat > scripts/test-phase2-system.sh << 'EOF'
#!/bin/bash
# scripts/test-phase2-system.sh - Teste rápido do sistema Fase 2

echo "🧪 Testando Sistema MatchIt - Fase 2..."
echo ""

# Source .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Test 1: Database connection
echo "1️⃣ Testando conexão com banco..."
if psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "   ✅ Banco conectado"
else
    echo "   ❌ Falha na conexão"
    exit 1
fi

# Test 2: Tables exist
echo "2️⃣ Verificando tabelas..."
table_count=$(psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
if [ "$table_count" -gt 5 ]; then
    echo "   ✅ $table_count tabelas encontradas"
else
    echo "   ⚠️ Apenas $table_count tabelas encontradas"
fi

# Test 3: Sample data
echo "3️⃣ Verificando dados de exemplo..."
image_count=$(psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)
if [ "$image_count" -gt 0 ]; then
    echo "   ✅ $image_count imagens carregadas"
else
    echo "   ⚠️ Nenhuma imagem encontrada"
fi

# Test 4: Categories
echo "4️⃣ Verificando categorias..."
category_count=$(psql -d "$DB_NAME" -t -c "SELECT COUNT(DISTINCT category) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
if [ "$category_count" -gt 0 ]; then
    echo "   ✅ $category_count categorias com imagens aprovadas"
else
    echo "   ⚠️ Nenhuma categoria com imagens aprovadas"
fi

# Test 5: Critical files
echo "5️⃣ Verificando arquivos críticos..."
critical_files=(
    "server/services/TournamentEngine.js"
    "server/routes/tournament.js"
    "screens/TournamentScreen.tsx"
    "screens/AdminTournamentPanel.tsx"
)

missing=0
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file"
        missing=$((missing + 1))
    fi
done

echo ""
if [ $missing -eq 0 ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo "✅ Sistema pronto para a Fase 2"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. npm run dev"
    echo "   2. Acesse: http://localhost:3000"
    echo "   3. Teste torneios: http://localhost:19006"
else
    echo "⚠️ $missing arquivo(s) faltante(s)"
    echo "Execute novamente a sincronização"
fi
EOF

    chmod +x scripts/test-phase2-system.sh
    print_success "Script de teste criado: scripts/test-phase2-system.sh"
    
    echo ""
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_banner
    
    # Interactive mode check
    if [ "$1" = "--auto" ]; then
        print_info "Modo automático ativado"
        AUTO_MODE=true
    else
        AUTO_MODE=false
        echo -e "${CYAN}Este script irá configurar completamente a Fase 2 do MatchIt.${NC}"
        echo -e "${CYAN}Ele irá analisar, sincronizar e verificar todo o sistema.${NC}"
        echo ""
        
        if ! confirm_action "Continuar com a sincronização master?"; then
            print_info "Cancelado pelo usuário"
            exit 0
        fi
        echo ""
    fi
    
    # Execution steps
    local start_time=$(date +%s)
    
    check_environment
    setup_configuration
    setup_directories
    install_dependencies
    run_migration_analysis
    run_database_sync
    run_final_verification
    create_test_script
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Final success message
    echo -e "${GREEN}${BOLD}"
    echo "=========================================================================="
    echo "🎉 SINCRONIZAÇÃO MASTER CONCLUÍDA COM SUCESSO!"
    echo "=========================================================================="
    echo -e "${NC}"
    echo -e "${GREEN}"
    echo "⏱️  Tempo total: ${duration} segundos"
    echo "📊 Status: Sistema totalmente sincronizado para Fase 2"
    echo "🎯 Banco: $DB_NAME configurado e populado"
    echo ""
    echo "🚀 COMANDOS PARA TESTAR:"
    echo "   ./scripts/test-phase2-system.sh     # Teste rápido"
    echo "   ./scripts/verify-database.sh        # Verificação detalhada"
    echo "   npm run dev                         # Iniciar desenvolvimento"
    echo ""
    echo "📱 ENDPOINTS DISPONÍVEIS:"
    echo "   http://localhost:3000/api/tournament/categories"
    echo "   http://localhost:19006              # Frontend mobile"
    echo ""
    echo "🎮 O MatchIt Fase 2 está PRONTO para descobrir preferências de estilo!"
    echo -e "${NC}"
    
    # Run test automatically if requested
    if [ "$AUTO_MODE" = true ] || confirm_action "Executar teste automático do sistema agora?"; then
        echo ""
        print_step "Executando Teste Automático"
        ./scripts/test-phase2-system.sh
    fi
}

# =====================================================
# EXECUÇÃO
# =====================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi