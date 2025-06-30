#!/bin/bash
# scripts/setup-database-phase0.sh - Setup completo do banco para Fase 0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configurações do banco de dados
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
DB_PASSWORD="matchit123"

print_banner() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}║    🗄️  SETUP DATABASE - FASE 0 MATCHIT 🗄️                 ║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}║    Criação do banco + migrações essenciais                  ║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para executar SQL com tratamento de erro
execute_sql() {
    local sql_command="$1"
    local description="$2"
    local database="${3:-$DB_NAME}"
    
    print_info "Executando: $description"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$database" -c "$sql_command" > /dev/null 2>&1; then
        print_success "$description"
        return 0
    else
        print_error "Falha: $description"
        return 1
    fi
}

# Função para executar arquivo SQL
execute_sql_file() {
    local file_path="$1"
    local description="$2"
    local database="${3:-$DB_NAME}"
    
    print_info "Executando arquivo: $description"
    
    if [ ! -f "$file_path" ]; then
        print_error "Arquivo não encontrado: $file_path"
        return 1
    fi
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$database" -f "$file_path" > /dev/null 2>&1; then
        print_success "$description"
        return 0
    else
        print_error "Falha: $description"
        return 1
    fi
}

# Verificar pré-requisitos
check_prerequisites() {
    print_step "🔍 VERIFICANDO PRÉ-REQUISITOS"
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ]; then
        print_error "Execute este script no diretório raiz do projeto MatchIt"
        exit 1
    fi
    print_success "Diretório do projeto correto"
    
    # Verificar se PostgreSQL está instalado
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL não está instalado"
        print_info "No Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        print_info "No macOS: brew install postgresql"
        print_info "No Windows: Baixe do https://postgresql.org"
        exit 1
    fi
    print_success "PostgreSQL está instalado"
    
    # Verificar se PostgreSQL está rodando
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
        print_error "PostgreSQL não está rodando"
        print_info "No Ubuntu/Debian: sudo systemctl start postgresql"
        print_info "No macOS: brew services start postgresql"
        print_info "No Windows: Inicie o serviço PostgreSQL"
        exit 1
    fi
    print_success "PostgreSQL está rodando"
    
    # Criar diretório de migrações se não existir
    mkdir -p database/migrations
    print_success "Diretório de migrações verificado"
}

# Configurar usuário e banco de dados
setup_database_and_user() {
    print_step "🏗️  CONFIGURANDO BANCO E USUÁRIO"
    
    # Tentar conectar como postgres para criar usuário e banco
    print_info "Conectando como superusuário postgres..."
    
    # Verificar se usuário matchit já existe
    if PGPASSWORD="" psql -h "$DB_HOST" -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        print_success "Usuário $DB_USER já existe"
    else
        print_info "Criando usuário $DB_USER..."
        if PGPASSWORD="" psql -h "$DB_HOST" -U postgres -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null 2>&1; then
            print_success "Usuário $DB_USER criado"
        else
            print_warning "Tentando método alternativo para criar usuário..."
            # Tentar como usuário atual do sistema
            if sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null 2>&1; then
                print_success "Usuário $DB_USER criado (método alternativo)"
            else
                print_error "Não foi possível criar usuário. Faça manualmente:"
                echo "sudo -u postgres psql"
                echo "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
                echo "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
                echo "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
                echo "\\q"
                exit 1
            fi
        fi
    fi
    
    # Verificar se banco matchit_db já existe
    if PGPASSWORD="" psql -h "$DB_HOST" -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_success "Banco $DB_NAME já existe"
    else
        print_info "Criando banco $DB_NAME..."
        if PGPASSWORD="" psql -h "$DB_HOST" -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null 2>&1; then
            print_success "Banco $DB_NAME criado"
        else
            print_warning "Tentando método alternativo para criar banco..."
            if sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null 2>&1; then
                print_success "Banco $DB_NAME criado (método alternativo)"
            else
                print_error "Não foi possível criar banco"
                exit 1
            fi
        fi
    fi
    
    # Garantir privilégios
    print_info "Configurando privilégios..."
    PGPASSWORD="" psql -h "$DB_HOST" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null 2>&1 || \
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null 2>&1
    
    print_success "Banco e usuário configurados"
}

# Testar conexão
test_connection() {
    print_step "🔌 TESTANDO CONEXÃO"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Conexão com banco funcionando"
        
        # Mostrar informações do banco
        version=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT version();" | head -n1)
        print_info "PostgreSQL: $(echo $version | cut -d' ' -f1-2)"
    else
        print_error "Não foi possível conectar ao banco"
        print_info "Verifique:"
        print_info "  - PostgreSQL está rodando?"
        print_info "  - Usuário e senha estão corretos?"
        print_info "  - Banco existe?"
        exit 1
    fi
}

# Criar migrações essenciais para Fase 0
create_essential_migrations() {
    print_step "📄 CRIANDO MIGRAÇÕES ESSENCIAIS"
    
    # 1. Sistema de controle de migrações
    print_info "Criando sistema de controle de migrações..."
    cat > database/migrations/000_migration_control.sql << 'EOF'
-- database/migrations/000_migration_control.sql - Sistema de controle de migrações

BEGIN;

-- Tabela de controle de migrações
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    checksum VARCHAR(64),
    description TEXT,
    category VARCHAR(50) DEFAULT 'core',
    priority VARCHAR(20) DEFAULT 'medium'
);

-- Tabela de logs de migração
CREATE TABLE IF NOT EXISTS migration_logs (
    id SERIAL PRIMARY KEY,
    migration_version VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'up', 'down', 'failed'
    executed_at TIMESTAMP DEFAULT NOW(),
    execution_time_ms INTEGER,
    error_message TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_migration_logs_version ON migration_logs(migration_version);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at);

-- Registrar esta migração
INSERT INTO schema_migrations (version, filename, description, category, priority)
VALUES ('000', '000_migration_control.sql', 'Sistema de controle de migrações', 'core', 'critical')
ON CONFLICT (version) DO NOTHING;

COMMIT;
EOF
    
    # 2. Schema básico para Fase 0
    print_info "Criando schema básico para Fase 0..."
    cat > database/migrations/001_basic_schema_phase0.sql << 'EOF'
-- database/migrations/001_basic_schema_phase0.sql - Schema básico para Fase 0

BEGIN;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20),
    location POINT,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de preferências de estilo (agregadas por categoria)
CREATE TABLE IF NOT EXISTS user_style_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    preference_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Tabela de escolhas individuais de estilo (para analytics)
CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    option_a VARCHAR(200),
    option_b VARCHAR(200), 
    selected_option VARCHAR(200) NOT NULL,
    response_time_ms INTEGER,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    auto_save_enabled BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'normal',
    settings_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_user_id ON user_style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_style_preferences_category ON user_style_preferences(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_session_id ON style_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Registrar migração
INSERT INTO schema_migrations (version, filename, description, category, priority)
VALUES ('001', '001_basic_schema_phase0.sql', 'Schema básico para Fase 0', 'core', 'critical')
ON CONFLICT (version) DO NOTHING;

COMMIT;
EOF
    
    # 3. Dados de teste
    print_info "Criando dados de teste..."
    cat > database/migrations/002_test_data_phase0.sql << 'EOF'
-- database/migrations/002_test_data_phase0.sql - Dados de teste para Fase 0

BEGIN;

-- Inserir usuário de teste
INSERT INTO users (name, email, age, gender, is_active) 
VALUES ('Usuário Teste', 'teste@matchit.com', 25, 'other', true)
ON CONFLICT (email) DO NOTHING;

-- Buscar ID do usuário de teste
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'teste@matchit.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir configurações padrão
        INSERT INTO user_settings (user_id, theme, notifications_enabled, auto_save_enabled)
        VALUES (test_user_id, 'light', true, true)
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Inserir algumas preferências de exemplo
        INSERT INTO user_style_preferences (user_id, category, preference_data, confidence_score)
        VALUES 
            (test_user_id, 'colors', '{"warm_colors": 0.8, "cool_colors": 0.2, "bright_colors": 0.7, "neutral_colors": 0.5}', 0.85),
            (test_user_id, 'styles', '{"casual": 0.9, "formal": 0.3, "sporty": 0.6, "vintage": 0.4}', 0.75)
        ON CONFLICT (user_id, category) DO NOTHING;
        
        -- Inserir algumas escolhas de exemplo
        INSERT INTO style_choices (user_id, category, question_id, selected_option, response_time_ms, confidence_level)
        VALUES 
            (test_user_id, 'colors', 'warm_vs_cool_1', 'warm_colors', 1500, 4),
            (test_user_id, 'colors', 'bright_vs_neutral_1', 'bright_colors', 2000, 3),
            (test_user_id, 'styles', 'casual_vs_formal_1', 'casual', 1200, 5),
            (test_user_id, 'styles', 'sporty_vs_vintage_1', 'sporty', 1800, 3)
        ON CONFLICT (user_id, category, question_id) DO NOTHING;
    END IF;
END $$;

-- Registrar migração
INSERT INTO schema_migrations (version, filename, description, category, priority)
VALUES ('002', '002_test_data_phase0.sql', 'Dados de teste para Fase 0', 'data', 'low')
ON CONFLICT (version) DO NOTHING;

COMMIT;
EOF
    
    print_success "Migrações essenciais criadas"
}

# Executar migrações
run_migrations() {
    print_step "🚀 EXECUTANDO MIGRAÇÕES"
    
    local migrations=(
        "000_migration_control.sql:Sistema de controle"
        "001_basic_schema_phase0.sql:Schema básico"
        "002_test_data_phase0.sql:Dados de teste"
    )
    
    for migration in "${migrations[@]}"; do
        IFS=':' read -r file description <<< "$migration"
        execute_sql_file "database/migrations/$file" "$description"
        
        if [ $? -ne 0 ]; then
            print_error "Falha na migração: $file"
            exit 1
        fi
    done
    
    print_success "Todas as migrações executadas"
}

# Verificar estado final
verify_setup() {
    print_step "✅ VERIFICANDO ESTADO FINAL"
    
    # Verificar tabelas criadas
    print_info "Verificando tabelas criadas..."
    
    local expected_tables=(
        "schema_migrations"
        "migration_logs"
        "users"
        "user_style_preferences"
        "style_choices"
        "user_settings"
    )
    
    for table in "${expected_tables[@]}"; do
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" | grep -q 't'; then
            print_success "Tabela $table existe"
        else
            print_error "Tabela $table não encontrada"
        fi
    done
    
    # Verificar dados de teste
    print_info "Verificando dados de teste..."
    
    local user_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;")
    print_info "Usuários cadastrados: $user_count"
    
    local prefs_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM user_style_preferences;")
    print_info "Preferências cadastradas: $prefs_count"
    
    local choices_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM style_choices;")
    print_info "Escolhas cadastradas: $choices_count"
    
    # Verificar migrações executadas
    local migrations_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM schema_migrations;")
    print_info "Migrações executadas: $migrations_count"
    
    print_success "Verificação concluída"
}

# Mostrar resumo final
show_summary() {
    print_step "📋 RESUMO FINAL"
    
    echo -e "${GREEN}🎉 SETUP DO BANCO CONCLUÍDO COM SUCESSO! 🎉${NC}"
    echo ""
    echo -e "${BLUE}Configurações do banco:${NC}"
    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"
    echo "   Password: $DB_PASSWORD"
    echo ""
    echo -e "${BLUE}Tabelas criadas para Fase 0:${NC}"
    echo "   ✅ users - Usuários do sistema"
    echo "   ✅ user_style_preferences - Preferências agregadas por categoria"
    echo "   ✅ style_choices - Escolhas individuais para analytics"
    echo "   ✅ user_settings - Configurações do usuário"
    echo "   ✅ schema_migrations - Controle de migrações"
    echo "   ✅ migration_logs - Logs de execução"
    echo ""
    echo -e "${BLUE}Dados de teste inseridos:${NC}"
    echo "   ✅ Usuário: teste@matchit.com"
    echo "   ✅ Preferências de cores e estilos"
    echo "   ✅ Escolhas de exemplo"
    echo "   ✅ Configurações padrão"
    echo ""
    echo -e "${YELLOW}Próximos passos:${NC}"
    echo "   1. Execute: ./scripts/finalize-phase0.sh"
    echo "   2. Inicie o servidor: npm run server"
    echo "   3. Execute os testes: ./scripts/test-phase0-complete.sh"
    echo ""
    echo -e "${GREEN}✅ Banco pronto para a Fase 0!${NC}"
}

# Função principal
main() {
    print_banner
    
    # Executar etapas em ordem
    check_prerequisites
    setup_database_and_user
    test_connection
    create_essential_migrations
    run_migrations
    verify_setup
    show_summary
    
    print_success "Setup do banco concluído com sucesso!"
}

# Executar script
main "$@"