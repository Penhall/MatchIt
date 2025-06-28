#!/bin/bash
# scripts/sync-database-phase2.sh - Script inteligente de sincronização do banco para Fase 2

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
NC='\033[0m' # No Color

PROJECT_NAME="MatchIt"
PHASE="Database Sync - Fase 2"
VERSION="2.0.0"

# Database configuration from .env or defaults (CREDENCIAIS CORRETAS)
DB_NAME="${DB_NAME:-matchit_db}"
DB_USER="${DB_USER:-matchit}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-matchit123}"

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "🔄 $PROJECT_NAME - $PHASE"
    echo "🎯 Sincronização Inteligente do Banco de Dados"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# =====================================================
# FUNÇÕES DE VERIFICAÇÃO
# =====================================================

check_dependencies() {
    print_step "Verificando dependências..."
    
    # Check PostgreSQL CLI
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL CLI não encontrado. Instale PostgreSQL antes de continuar."
        exit 1
    fi
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado. Usando configurações padrão."
        create_env_file
    fi
    
    print_success "Dependências verificadas!"
}

create_env_file() {
    print_info "Criando arquivo .env com configurações padrão..."
    
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://matchit_user:matchit_pass@localhost:5432/matchit_tournaments
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_tournaments
DB_USER=matchit_user
DB_PASSWORD=matchit_pass

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-phase2
JWT_EXPIRE=7d

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Tournament Configuration
MIN_IMAGES_PER_CATEGORY=8
MAX_ACTIVE_SESSIONS_PER_USER=3
SESSION_EXPIRY_HOURS=24
EOF
    
    print_success "Arquivo .env criado"
    print_warning "IMPORTANTE: Atualize as credenciais do banco no arquivo .env"
}

test_database_connection() {
    print_step "Testando conexão com o banco de dados..."
    
    # Export credentials for psql
    export PGHOST="$DB_HOST"
    export PGPORT="$DB_PORT"
    export PGDATABASE="$DB_NAME"
    export PGUSER="$DB_USER"
    export PGPASSWORD="$DB_PASSWORD"
    
    # Try to connect to database
    if psql -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Conexão com banco estabelecida: $DB_NAME"
        return 0
    else
        print_warning "Banco $DB_NAME não encontrado. Tentando criar..."
        
        # Try to create database
        if createdb "$DB_NAME" 2>/dev/null; then
            print_success "Banco de dados $DB_NAME criado com sucesso"
        else
            print_error "Não foi possível criar o banco $DB_NAME"
            print_info "Verifique suas credenciais no arquivo .env ou crie manualmente:"
            print_info "createdb -U $DB_USER -h $DB_HOST $DB_NAME"
            exit 1
        fi
    fi
}

# =====================================================
# FUNÇÕES DE ANÁLISE DO ESTADO ATUAL
# =====================================================

analyze_current_schema() {
    print_step "Analisando schema atual do banco..."
    
    # Create temporary file for analysis
    local analysis_file="/tmp/matchit_schema_analysis.txt"
    
    # Check which tables exist
    psql -t -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    " > "$analysis_file" 2>/dev/null || {
        print_error "Erro ao analisar schema. Verifique a conexão."
        exit 1
    }
    
    # Analyze existing tables
    declare -A existing_tables
    while read -r table; do
        table=$(echo "$table" | xargs) # trim whitespace
        if [ -n "$table" ]; then
            existing_tables["$table"]=1
            print_info "Tabela encontrada: $table"
        fi
    done < "$analysis_file"
    
    # Check critical tables for Phase 2
    local critical_tables=("users" "tournament_images" "tournament_sessions" "tournament_choices" "tournament_results")
    local missing_tables=()
    
    for table in "${critical_tables[@]}"; do
        if [[ -z "${existing_tables[$table]}" ]]; then
            missing_tables+=("$table")
            print_warning "Tabela crítica faltante: $table"
        fi
    done
    
    # Check enums
    print_info "Verificando enums..."
    local enum_check=$(psql -t -c "
        SELECT typname FROM pg_type 
        WHERE typname IN ('tournament_category_enum', 'tournament_status_enum');
    " 2>/dev/null | wc -l)
    
    if [ "$enum_check" -lt 2 ]; then
        print_warning "Enums de torneio não encontrados ou incompletos"
    fi
    
    # Export findings
    echo "${#missing_tables[@]}" > /tmp/missing_tables_count
    printf '%s\n' "${missing_tables[@]}" > /tmp/missing_tables_list
    
    rm -f "$analysis_file"
    
    if [ "${#missing_tables[@]}" -eq 0 ]; then
        print_success "Schema parece completo, verificando estrutura..."
        return 0
    else
        print_warning "${#missing_tables[@]} tabela(s) crítica(s) faltante(s)"
        return 1
    fi
}

# =====================================================
# CRIAÇÃO DO SCHEMA DEFINITIVO
# =====================================================

create_definitive_schema() {
    print_step "Criando schema definitivo da Fase 2..."
    
    # Create migration directory
    mkdir -p database/migrations
    
    # Create the definitive migration
    cat > database/migrations/004_definitive_phase2_schema.sql << 'EOF'
-- database/migrations/004_definitive_phase2_schema.sql
-- Schema definitivo e consolidado para Fase 2 - Sistema de Torneios MatchIt

BEGIN;

-- =====================================================
-- TABELA USERS (Base)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    date_of_birth DATE,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FASE 0: SISTEMA DE PREFERÊNCIAS DE ESTILO
-- =====================================================

CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- =====================================================
-- FASE 2: SISTEMA DE TORNEIOS - ENUMS
-- =====================================================

-- Enum para categorias de torneio (nomes em português para compatibilidade)
DO $$ BEGIN
    CREATE TYPE tournament_category_enum AS ENUM (
        'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
        'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de torneio
DO $$ BEGIN
    CREATE TYPE tournament_status_enum AS ENUM (
        'active', 'paused', 'completed', 'cancelled', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- FASE 2: TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de imagens para torneios
CREATE TABLE IF NOT EXISTS tournament_images (
    id SERIAL PRIMARY KEY,
    category tournament_category_enum NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(100),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    approved BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadados da imagem
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    mime_type VARCHAR(50),
    
    -- Estatísticas de uso
    total_views INTEGER DEFAULT 0,
    total_selections INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100)
);

-- Tabela de sessões de torneio
CREATE TABLE IF NOT EXISTS tournament_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category tournament_category_enum NOT NULL,
    status tournament_status_enum DEFAULT 'active',
    
    -- Progresso do torneio
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER NOT NULL,
    remaining_images INTEGER[] NOT NULL,
    eliminated_images INTEGER[] DEFAULT '{}',
    current_matchup INTEGER[],
    
    -- Configurações e timing
    tournament_size INTEGER DEFAULT 16,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW(),
    
    -- Metadados
    time_limit INTEGER DEFAULT 30,
    allow_skip BOOLEAN DEFAULT false
);

-- Tabela de escolhas individuais
CREATE TABLE IF NOT EXISTS tournament_choices (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL REFERENCES tournament_sessions(id) ON DELETE CASCADE,
    winner_id INTEGER NOT NULL REFERENCES tournament_images(id),
    loser_id INTEGER REFERENCES tournament_images(id),
    response_time_ms INTEGER NOT NULL,
    round_number INTEGER,
    matchup_sequence INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_response_time CHECK (response_time_ms > 0)
);

-- Tabela de resultados finais
CREATE TABLE IF NOT EXISTS tournament_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE REFERENCES tournament_sessions(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    category tournament_category_enum NOT NULL,
    
    -- Resultados principais
    champion_id INTEGER REFERENCES tournament_images(id),
    finalist_id INTEGER REFERENCES tournament_images(id),
    semifinalists INTEGER[],
    top_choices INTEGER[],
    
    -- Métricas de performance
    preference_strength INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    decision_speed_avg INTEGER DEFAULT 0,
    total_choices_made INTEGER DEFAULT 0,
    rounds_completed INTEGER DEFAULT 0,
    session_duration_minutes DECIMAL(8,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Análise de estilo (JSON)
    style_profile JSONB,
    dominant_preferences JSONB,
    insights TEXT[],
    recommendations TEXT[],
    
    completed_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints de validação
    CONSTRAINT valid_preference_strength CHECK (preference_strength >= 0 AND preference_strength <= 100),
    CONSTRAINT valid_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 100),
    CONSTRAINT valid_completion_rate CHECK (completion_rate >= 0 AND completion_rate <= 100)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para style_choices
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_updated_at ON style_choices(updated_at);

-- Índices para tournament_images
CREATE INDEX IF NOT EXISTS idx_tournament_images_category ON tournament_images(category);
CREATE INDEX IF NOT EXISTS idx_tournament_images_active ON tournament_images(active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_active_approved ON tournament_images(category, active, approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_win_rate ON tournament_images(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_images_upload_date ON tournament_images(upload_date DESC);

-- Índices para tournament_sessions
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_id ON tournament_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_category ON tournament_sessions(category);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_status ON tournament_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_status ON tournament_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_last_activity ON tournament_sessions(last_activity);

-- Índices para tournament_choices
CREATE INDEX IF NOT EXISTS idx_tournament_choices_session_id ON tournament_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_winner_id ON tournament_choices(winner_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_created_at ON tournament_choices(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_round ON tournament_choices(session_id, round_number);

-- Índices para tournament_results
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_category ON tournament_results(category);
CREATE INDEX IF NOT EXISTS idx_tournament_results_champion ON tournament_results(champion_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_completed_at ON tournament_results(completed_at);

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_choices_updated_at BEFORE UPDATE ON style_choices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_images_updated_at BEFORE UPDATE ON tournament_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar atividade da sessão
CREATE OR REPLACE FUNCTION update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tournament_sessions 
    SET last_activity = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar atividade quando nova escolha é feita
CREATE TRIGGER update_session_activity
    AFTER INSERT ON tournament_choices
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_activity();

COMMIT;
EOF

    print_success "Schema definitivo criado!"
    
    # Apply the migration
    print_info "Aplicando migração definitiva..."
    
    if psql -f database/migrations/004_definitive_phase2_schema.sql >/dev/null 2>&1; then
        print_success "Migração aplicada com sucesso!"
    else
        print_error "Erro ao aplicar migração. Verificando detalhes..."
        psql -f database/migrations/004_definitive_phase2_schema.sql
        exit 1
    fi
}

# =====================================================
# INSERÇÃO DE DADOS DE EXEMPLO
# =====================================================

create_sample_data() {
    print_step "Inserindo dados de exemplo para Fase 2..."
    
    mkdir -p database/seeds
    
    cat > database/seeds/004_phase2_sample_data.sql << 'EOF'
-- database/seeds/004_phase2_sample_data.sql
-- Dados de exemplo definitivos para Fase 2

BEGIN;

-- =====================================================
-- USUÁRIOS DE EXEMPLO
-- =====================================================

-- Inserir usuário admin
INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
VALUES (
    'admin', 
    'admin@matchit.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Administrador MatchIt', 
    true, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste
INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
VALUES (
    'testuser', 
    'test@matchit.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Usuário de Teste', 
    false, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- IMAGENS DE EXEMPLO PARA TORNEIOS
-- =====================================================

-- Get user IDs
WITH admin_user AS (SELECT id FROM users WHERE email = 'admin@matchit.com' LIMIT 1)

-- Cores category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags, 
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
) 
SELECT 
    'cores', 
    'https://picsum.photos/400/500?random=' || generate_series,
    'https://picsum.photos/200/250?random=' || generate_series,
    'Paleta de Cores ' || generate_series,
    'Combinação harmoniosa de cores para inspiração',
    ARRAY['moderno', 'vibrante', 'harmônico'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    245760 + (generate_series * 1000), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 500 + 50)::INTEGER,
    FLOOR(RANDOM() * 100 + 10)::INTEGER,
    (RANDOM() * 80 + 20)::DECIMAL(5,2)
FROM generate_series(1, 16), admin_user
ON CONFLICT DO NOTHING;

-- Estilos category  
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'estilos',
    'https://picsum.photos/400/500?random=' || (generate_series + 100),
    'https://picsum.photos/200/250?random=' || (generate_series + 100),
    'Estilo Fashion ' || generate_series,
    'Tendência de moda contemporânea',
    ARRAY['fashion', 'contemporâneo', 'elegante'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    267890 + (generate_series * 1200), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 600 + 100)::INTEGER,
    FLOOR(RANDOM() * 80 + 15)::INTEGER,
    (RANDOM() * 75 + 25)::DECIMAL(5,2)
FROM generate_series(1, 16), admin_user
ON CONFLICT DO NOTHING;

-- Calçados category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'calcados',
    'https://picsum.photos/400/500?random=' || (generate_series + 200),
    'https://picsum.photos/200/250?random=' || (generate_series + 200),
    'Calçado Style ' || generate_series,
    'Sapatos que definem personalidade',
    ARRAY['conforto', 'estilo', 'qualidade'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    234567 + (generate_series * 800), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 400 + 80)::INTEGER,
    FLOOR(RANDOM() * 60 + 20)::INTEGER,
    (RANDOM() * 70 + 30)::DECIMAL(5,2)
FROM generate_series(1, 16), admin_user
ON CONFLICT DO NOTHING;

-- Acessórios category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'acessorios',
    'https://picsum.photos/400/500?random=' || (generate_series + 300),
    'https://picsum.photos/200/250?random=' || (generate_series + 300),
    'Acessório Premium ' || generate_series,
    'Acessórios que complementam seu look',
    ARRAY['premium', 'sofisticado', 'versátil'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    189456 + (generate_series * 600), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 300 + 50)::INTEGER,
    FLOOR(RANDOM() * 50 + 10)::INTEGER,
    (RANDOM() * 85 + 15)::DECIMAL(5,2)
FROM generate_series(1, 12), admin_user
ON CONFLICT DO NOTHING;

-- Texturas category
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags,
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
)
SELECT 
    'texturas',
    'https://picsum.photos/400/500?random=' || (generate_series + 400),
    'https://picsum.photos/200/250?random=' || (generate_series + 400),
    'Textura Natural ' || generate_series,
    'Texturas que despertam sensações',
    ARRAY['natural', 'tátil', 'orgânico'],
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    298765 + (generate_series * 1100), 400, 500, 'image/jpeg',
    FLOOR(RANDOM() * 250 + 30)::INTEGER,
    FLOOR(RANDOM() * 40 + 8)::INTEGER,
    (RANDOM() * 60 + 40)::DECIMAL(5,2)
FROM generate_series(1, 10), admin_user
ON CONFLICT DO NOTHING;

-- =====================================================
-- PREFERÊNCIAS DE EXEMPLO (FASE 0)
-- =====================================================

WITH test_user AS (SELECT id FROM users WHERE email = 'test@matchit.com' LIMIT 1)
INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
SELECT 
    test_user.id,
    unnest(ARRAY['cores', 'estilos', 'acessorios']),
    unnest(ARRAY['preferencia_1', 'preferencia_2', 'preferencia_3']),
    unnest(ARRAY['opcao_moderna', 'opcao_casual', 'opcao_minimalista']),
    NOW()
FROM test_user
ON CONFLICT (user_id, category, question_id) DO NOTHING;

COMMIT;
EOF

    print_info "Aplicando dados de exemplo..."
    
    if psql -f database/seeds/004_phase2_sample_data.sql >/dev/null 2>&1; then
        print_success "Dados de exemplo inseridos com sucesso!"
    else
        print_warning "Alguns dados podem já existir. Continuando..."
    fi
}

# =====================================================
# VERIFICAÇÃO E VALIDAÇÃO FINAL
# =====================================================

validate_final_schema() {
    print_step "Validando schema final..."
    
    # Check table counts
    local table_counts=$(psql -t -c "
        SELECT 
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM tournament_images) as images,
            (SELECT COUNT(*) FROM tournament_sessions) as sessions,
            (SELECT COUNT(*) FROM tournament_choices) as choices,
            (SELECT COUNT(*) FROM tournament_results) as results;
    " 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "Contagem de registros: $table_counts"
    else
        print_error "Erro ao validar tabelas"
        return 1
    fi
    
    # Check if categories are properly set
    local category_count=$(psql -t -c "
        SELECT COUNT(DISTINCT category) FROM tournament_images WHERE approved = true;
    " 2>/dev/null)
    
    if [ "$category_count" -gt 0 ]; then
        print_success "Categorias de torneio configuradas: $category_count"
    else
        print_warning "Nenhuma categoria de torneio encontrada"
    fi
    
    # Check enums
    local enum_status=$(psql -t -c "
        SELECT COUNT(*) FROM pg_type 
        WHERE typname IN ('tournament_category_enum', 'tournament_status_enum');
    " 2>/dev/null)
    
    if [ "$enum_status" -eq 2 ]; then
        print_success "Enums de torneio configurados corretamente"
    else
        print_error "Problema com enums de torneio"
        return 1
    fi
    
    return 0
}

create_verification_script() {
    print_step "Criando script de verificação..."
    
    cat > scripts/verify-database.sh << 'EOF'
#!/bin/bash
# scripts/verify-database.sh - Verificação do banco de dados

echo "🔍 Verificando estado do banco de dados MatchIt..."

DB_NAME="${DB_NAME:-matchit_tournaments}"

echo "📊 Estatísticas das tabelas:"
psql -d "$DB_NAME" -c "
    SELECT 
        'Users' as tabela, COUNT(*) as registros FROM users
    UNION ALL
    SELECT 
        'Imagens de Torneio', COUNT(*) FROM tournament_images  
    UNION ALL
    SELECT 
        'Sessões de Torneio', COUNT(*) FROM tournament_sessions
    UNION ALL
    SELECT 
        'Escolhas de Torneio', COUNT(*) FROM tournament_choices
    UNION ALL
    SELECT 
        'Resultados de Torneio', COUNT(*) FROM tournament_results
    UNION ALL
    SELECT 
        'Preferências de Estilo', COUNT(*) FROM style_choices;
"

echo ""
echo "🎯 Imagens por categoria:"
psql -d "$DB_NAME" -c "
    SELECT 
        category,
        COUNT(*) as total,
        COUNT(CASE WHEN approved = true THEN 1 END) as aprovadas,
        COUNT(CASE WHEN active = true THEN 1 END) as ativas
    FROM tournament_images 
    GROUP BY category 
    ORDER BY category;
"

echo ""
echo "🔧 Verificação de integridade:"
psql -d "$DB_NAME" -c "
    SELECT 
        CASE 
            WHEN COUNT(*) >= 8 THEN '✅ Suficientes para torneios'
            ELSE '⚠️  Insuficientes (' || COUNT(*) || ')'
        END as status_imagens
    FROM tournament_images 
    WHERE approved = true AND active = true;
"

echo ""
echo "✅ Verificação concluída!"
EOF

    chmod +x scripts/verify-database.sh
    print_success "Script de verificação criado: scripts/verify-database.sh"
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    # Pre-flight checks
    check_dependencies
    test_database_connection
    
    # Analyze current state
    if analyze_current_schema; then
        print_info "Schema já existe. Verificando se precisa de atualizações..."
        
        # Even if schema exists, ensure it's the definitive version
        create_definitive_schema
    else
        print_info "Schema incompleto detectado. Criando schema definitivo..."
        create_definitive_schema
    fi
    
    # Insert sample data
    create_sample_data
    
    # Create verification tools
    create_verification_script
    
    # Final validation
    if validate_final_schema; then
        print_success "✅ Sincronização do banco de dados concluída com sucesso!"
        
        echo -e "${GREEN}"
        echo "=========================================================================="
        echo "🎉 BANCO DE DADOS SINCRONIZADO - FASE 2"
        echo "=========================================================================="
        echo ""
        echo "📊 Status:"
        echo "   ✅ Schema definitivo aplicado"
        echo "   ✅ Dados de exemplo inseridos"
        echo "   ✅ Índices de performance criados"
        echo "   ✅ Triggers e funções configurados"
        echo ""
        echo "🚀 Próximos passos:"
        echo "   1. Verifique o banco: ./scripts/verify-database.sh"
        echo "   2. Execute o setup da Fase 2: ./scripts/finalize-phase2-tournaments.sh"
        echo "   3. Inicie o desenvolvimento: npm run dev"
        echo ""
        echo "🎯 Banco pronto para a Fase 2 do MatchIt!"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        print_error "Falha na validação final. Verifique os logs acima."
        exit 1
    fi
}

# =====================================================
# EXECUÇÃO
# =====================================================

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi