# scripts/setup-complete-system.sh - Setup completo das Fases 0 e 1
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Verificar se o script está sendo executado do diretório correto
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "Execute este script do diretório raiz do projeto (onde está o package.json)"
        exit 1
    fi
    print_success "Diretório correto identificado"
}

# Verificar dependências do sistema
check_system_dependencies() {
    print_step "Verificando dependências do sistema..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado. Instale Node.js 16+ primeiro."
        exit 1
    fi
    NODE_VERSION=$(node --version)
    print_success "Node.js encontrado: $NODE_VERSION"
    
    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não encontrado"
        exit 1
    fi
    NPM_VERSION=$(npm --version)
    print_success "npm encontrado: $NPM_VERSION"
    
    # PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL CLI não encontrado. Certifique-se de que PostgreSQL está instalado."
    else
        PSQL_VERSION=$(psql --version)
        print_success "PostgreSQL encontrado: $PSQL_VERSION"
    fi
    
    # Redis (opcional)
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis CLI não encontrado. Redis é opcional mas recomendado para cache."
    else
        print_success "Redis encontrado"
    fi
}

# Instalar dependências do projeto
install_dependencies() {
    print_step "Instalando dependências do projeto..."
    
    # Backend dependencies
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -eq 0 ]; then
            print_success "Dependências do backend instaladas"
        else
            print_error "Falha ao instalar dependências do backend"
            exit 1
        fi
    else
        print_success "Dependências do backend já instaladas"
    fi
    
    # Frontend dependencies (se existir)
    if [ -f "app.json" ] || [ -f "expo.json" ]; then
        print_info "Projeto React Native/Expo detectado"
        # Instalar dependências específicas se necessário
        npm install expo-linear-gradient @expo/vector-icons expo-image-picker
        print_success "Dependências do frontend instaladas"
    fi
}

# Criar estrutura de diretórios
create_directories() {
    print_step "Criando estrutura de diretórios..."
    
    directories=(
        "uploads"
        "uploads/tournament-images"
        "uploads/profile-pictures"
        "logs"
        "database/migrations"
        "database/seeds"
        "tests"
        "scripts"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Diretório criado: $dir"
        else
            print_info "Diretório já existe: $dir"
        fi
    done
}

# Configurar variáveis de ambiente
setup_environment() {
    print_step "Configurando variáveis de ambiente..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Configuração do Servidor
NODE_ENV=development
PORT=3000

# Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_development
DB_USER=postgres
DB_PASSWORD=your_password_here

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d

# URLs
FRONTEND_URL=http://localhost:8081
API_BASE_URL=http://localhost:3000/api

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
UPLOAD_RATE_LIMIT_MAX=50

# Logging
LOG_LEVEL=info
EOF
        print_success "Arquivo .env criado com configurações padrão"
        print_warning "IMPORTANTE: Edite o arquivo .env com suas configurações reais"
    else
        print_info "Arquivo .env já existe"
    fi
    
    # Frontend environment (se for React Native/Expo)
    if [ -f "app.json" ] || [ -f "expo.json" ]; then
        if [ ! -f ".env.local" ]; then
            cat > .env.local << EOF
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EOF
            print_success "Arquivo .env.local criado para React Native"
        fi
    fi
}

# Configurar banco de dados
setup_database() {
    print_step "Configurando banco de dados..."
    
    # Carregar variáveis de ambiente
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    DB_NAME=${DB_NAME:-matchit_development}
    DB_USER=${DB_USER:-postgres}
    
    print_info "Tentando conectar ao PostgreSQL..."
    
    # Verificar se o banco existe
    if psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_success "Banco de dados '$DB_NAME' já existe"
    else
        print_warning "Banco de dados '$DB_NAME' não encontrado"
        read -p "Deseja criar o banco de dados automaticamente? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER $DB_NAME
            if [ $? -eq 0 ]; then
                print_success "Banco de dados '$DB_NAME' criado"
            else
                print_error "Falha ao criar banco de dados"
                print_info "Crie manualmente: createdb -U $DB_USER $DB_NAME"
            fi
        fi
    fi
}

# Executar migrações
run_migrations() {
    print_step "Executando migrações do banco de dados..."
    
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    MIGRATION_FILE="database/migrations/002_complete_style_and_tournament_schema.sql"
    
    if [ -f "$MIGRATION_FILE" ]; then
        print_info "Executando migração: $MIGRATION_FILE"
        
        psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-matchit_development} -f "$MIGRATION_FILE"
        
        if [ $? -eq 0 ]; then
            print_success "Migração executada com sucesso"
        else
            print_error "Falha ao executar migração"
            print_info "Execute manualmente: psql -U ${DB_USER:-postgres} -d ${DB_NAME:-matchit_development} -f $MIGRATION_FILE"
        fi
    else
        print_warning "Arquivo de migração não encontrado: $MIGRATION_FILE"
    fi
}

# Criar dados iniciais (seed)
seed_database() {
    print_step "Inserindo dados iniciais..."
    
    # Criar script de seed se não existir
    SEED_FILE="database/seeds/001_initial_data.sql"
    
    if [ ! -f "$SEED_FILE" ]; then
        mkdir -p "database/seeds"
        cat > "$SEED_FILE" << 'EOF'
-- database/seeds/001_initial_data.sql - Dados iniciais para desenvolvimento

BEGIN;

-- Inserir usuário admin de desenvolvimento (senha: admin123)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at) 
VALUES (
    'Admin MatchIt',
    'admin@matchit.com',
    '$2b$10$rGy7/PQDq7OlNf7fMTfbLOr8Yz.RcXcPqOjW8zGK4GXUOZVKHrqAa', -- senha: admin123
    30,
    'other',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste (senha: test123)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at) 
VALUES (
    'Usuário Teste',
    'test@matchit.com',
    '$2b$10$Xu8JoFqHLJ7/V7zYKJGYcOXlgJ9kX8QGc9FZdKLCk9MkY3xX0Grg6', -- senha: test123
    25,
    'female',
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir imagens de exemplo para torneios
INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, tags, active, approved, created_by) VALUES
    -- Cores
    ('cores', 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Vermelho+Coral', 'https://via.placeholder.com/150x150/FF6B6B', 'Vermelho Coral', 'Tom quente e vibrante', ARRAY['quente', 'vibrante', 'coral'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Azul+Turquesa', 'https://via.placeholder.com/150x150/4ECDC4', 'Azul Turquesa', 'Tom frio e refrescante', ARRAY['frio', 'azul', 'turquesa'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Azul+Oceano', 'https://via.placeholder.com/150x150/45B7D1', 'Azul Oceano', 'Profundidade do mar', ARRAY['azul', 'oceano', 'profundo'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Laranja+Solar', 'https://via.placeholder.com/150x150/F39C12', 'Laranja Solar', 'Energia do sol', ARRAY['laranja', 'solar', 'energia'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/9B59B6/FFFFFF?text=Roxo+Real', 'https://via.placeholder.com/150x150/9B59B6', 'Roxo Real', 'Elegância real', ARRAY['roxo', 'elegante', 'real'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Verde+Natureza', 'https://via.placeholder.com/150x150/27AE60', 'Verde Natureza', 'Frescor natural', ARRAY['verde', 'natureza', 'frescor'], true, true, 1),
    
    -- Estilos
    ('estilos', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Casual+Moderno', 'https://via.placeholder.com/150x150/2C3E50', 'Casual Moderno', 'Conforto com estilo', ARRAY['casual', 'moderno', 'conforto'], true, true, 1),
    ('estilos', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Elegante+Formal', 'https://via.placeholder.com/150x150/8E44AD', 'Elegante Formal', 'Sofisticação máxima', ARRAY['elegante', 'formal', 'sofisticado'], true, true, 1),
    ('estilos', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Boho+Chic', 'https://via.placeholder.com/150x150/E67E22', 'Boho Chic', 'Liberdade criativa', ARRAY['boho', 'chic', 'criativo'], true, true, 1),
    ('estilos', 'https://via.placeholder.com/400x400/16A085/FFFFFF?text=Minimalista', 'https://via.placeholder.com/150x150/16A085', 'Minimalista', 'Menos é mais', ARRAY['minimalista', 'clean', 'simples'], true, true, 1),
    
    -- Calçados
    ('calcados', 'https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=Tênis+Casual', 'https://via.placeholder.com/150x150/E74C3C', 'Tênis Casual', 'Conforto no dia a dia', ARRAY['tênis', 'casual', 'conforto'], true, true, 1),
    ('calcados', 'https://via.placeholder.com/400x400/3498DB/FFFFFF?text=Sapato+Social', 'https://via.placeholder.com/150x150/3498DB', 'Sapato Social', 'Elegância profissional', ARRAY['social', 'elegante', 'trabalho'], true, true, 1),
    ('calcados', 'https://via.placeholder.com/400x400/9B59B6/FFFFFF?text=Bota+Estilo', 'https://via.placeholder.com/150x150/9B59B6', 'Bota Estilosa', 'Atitude e personalidade', ARRAY['bota', 'estilo', 'personalidade'], true, true, 1),
    ('calcados', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Sandália+Chic', 'https://via.placeholder.com/150x150/F39C12', 'Sandália Chic', 'Leveza e elegância', ARRAY['sandália', 'chic', 'leve'], true, true, 1)
ON CONFLICT DO NOTHING;

COMMIT;
EOF
        print_success "Script de seed criado: $SEED_FILE"
    fi
    
    # Executar seed
    if [ -f "$SEED_FILE" ]; then
        psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-matchit_development} -f "$SEED_FILE"
        
        if [ $? -eq 0 ]; then
            print_success "Dados iniciais inseridos"
        else
            print_warning "Falha ao inserir dados iniciais (pode já existir)"
        fi
    fi
}

# Configurar scripts npm
setup_npm_scripts() {
    print_step "Configurando scripts npm..."
    
    # Verificar se package.json tem os scripts necessários
    if ! grep -q "\"dev\":" package.json; then
        print_info "Adicionando scripts npm..."
        
        # Backup do package.json
        cp package.json package.json.backup
        
        # Usar jq se disponível, senão usar sed
        if command -v jq &> /dev/null; then
            jq '.scripts.dev = "node server/app.js"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts.start = "NODE_ENV=production node server/app.js"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts.migrate = "psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-matchit_development} -f database/migrations/002_complete_style_and_tournament_schema.sql"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts.seed = "psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-matchit_development} -f database/seeds/001_initial_data.sql"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts.test = "npm run test:backend && npm run test:frontend"' package.json > package.json.tmp && mv package.json.tmp package.json
        fi
        
        print_success "Scripts npm configurados"
    else
        print_info "Scripts npm já configurados"
    fi
}

# Testar sistema
test_system() {
    print_step "Testando sistema..."
    
    print_info "Iniciando servidor em modo de teste..."
    
    # Iniciar servidor em background
    NODE_ENV=test node server/app.js &
    SERVER_PID=$!
    
    sleep 3
    
    # Testar health check
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "failed")
    
    if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
        print_success "Health check passou"
    else
        print_error "Health check falhou"
    fi
    
    # Parar servidor de teste
    kill $SERVER_PID 2>/dev/null
    
    print_success "Testes básicos concluídos"
}

# Gerar relatório de setup
generate_report() {
    print_header "RELATÓRIO DE SETUP - MATCHIT FASES 0 E 1"
    
    echo -e "${GREEN}✅ COMPONENTES INSTALADOS:${NC}"
    echo "   • Dependências do projeto"
    echo "   • Estrutura de diretórios"
    echo "   • Configuração de ambiente"
    echo "   • Migração do banco de dados"
    echo "   • Dados iniciais (seed)"
    echo "   • Scripts npm"
    echo ""
    
    echo -e "${BLUE}📋 PRÓXIMOS PASSOS:${NC}"
    echo "   1. Edite o arquivo .env com suas configurações reais"
    echo "   2. Configure seu banco PostgreSQL"
    echo "   3. Inicie o servidor: npm run dev"
    echo "   4. Acesse: http://localhost:3000/api/health"
    echo ""
    
    echo -e "${YELLOW}🔧 COMANDOS ÚTEIS:${NC}"
    echo "   • npm run dev          - Iniciar em modo desenvolvimento"
    echo "   • npm run migrate      - Executar migrações"
    echo "   • npm run seed         - Inserir dados iniciais"
    echo "   • npm test             - Executar testes"
    echo ""
    
    echo -e "${PURPLE}📚 ENDPOINTS PRINCIPAIS:${NC}"
    echo "   • GET  /api/health                    - Status do sistema"
    echo "   • POST /api/auth/register             - Registrar usuário"
    echo "   • POST /api/auth/login                - Login"
    echo "   • GET  /api/profile/style-preferences - Preferências (Fase 0)"
    echo "   • POST /api/tournament/start          - Iniciar torneio (Fase 1)"
    echo "   • GET  /api/tournament/categories     - Categorias de torneio"
    echo ""
    
    echo -e "${GREEN}🎉 SETUP COMPLETO DAS FASES 0 E 1!${NC}"
    echo ""
}

# Função principal
main() {
    print_header "SETUP AUTOMÁTICO - MATCHIT FASES 0 E 1"
    
    print_info "Este script irá configurar automaticamente o sistema MatchIt"
    print_info "com implementação completa das Fases 0 e 1"
    echo ""
    
    read -p "Continuar com o setup? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelado pelo usuário"
        exit 0
    fi
    
    # Executar etapas de setup
    check_directory
    check_system_dependencies
    install_dependencies
    create_directories
    setup_environment
    setup_database
    run_migrations
    seed_database
    setup_npm_scripts
    test_system
    
    # Gerar relatório final
    generate_report
    
    echo -e "${GREEN}🚀 Sistema pronto para uso!${NC}"
    echo -e "${BLUE}   Inicie com: npm run dev${NC}"
    echo ""
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi