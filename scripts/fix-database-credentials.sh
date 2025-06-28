#!/bin/bash
# scripts/fix-database-credentials.sh - Correção das credenciais do banco de dados

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
NC='\033[0m'

# =====================================================
# CREDENCIAIS CORRETAS
# =====================================================

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
DB_PASSWORD="matchit123"

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "🔧 MatchIt - Correção de Credenciais do Banco"
    echo "🎯 Ajustando para as credenciais corretas"
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
# CORREÇÃO DAS CREDENCIAIS
# =====================================================

fix_env_file() {
    print_step "Corrigindo arquivo .env..."
    
    # Backup do .env atual se existir
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backup criado: .env.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Criar .env com credenciais corretas
    cat > .env << EOF
# Database Configuration - Credenciais Corretas
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-matchit
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
    
    print_success "Arquivo .env atualizado com credenciais corretas"
    print_info "DB: $DB_NAME, User: $DB_USER, Host: $DB_HOST:$DB_PORT"
}

test_database_connection() {
    print_step "Testando conexão com as credenciais corretas..."
    
    # Export credentials for psql
    export PGHOST="$DB_HOST"
    export PGPORT="$DB_PORT"
    export PGDATABASE="$DB_NAME"
    export PGUSER="$DB_USER"
    export PGPASSWORD="$DB_PASSWORD"
    
    # Test connection
    if psql -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Conexão estabelecida com sucesso!"
        
        # Check if database has tables
        local table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        print_info "Tabelas encontradas: $table_count"
        
        # Check specifically for tournament tables
        local tournament_tables=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'tournament_%';" 2>/dev/null | xargs)
        if [ "$tournament_tables" -gt 0 ]; then
            print_success "Tabelas de torneio encontradas: $tournament_tables"
        else
            print_warning "Nenhuma tabela de torneio encontrada - será criada na sincronização"
        fi
        
    else
        print_error "Falha na conexão!"
        print_info "Verifique se:"
        print_info "  1. PostgreSQL está rodando"
        print_info "  2. O banco '$DB_NAME' existe"
        print_info "  3. O usuário '$DB_USER' tem permissões"
        print_info "  4. A senha está correta"
        return 1
    fi
}

fix_sync_script() {
    print_step "Corrigindo script de sincronização..."
    
    if [ -f "scripts/sync-database-phase2.sh" ]; then
        # Update default values in sync script
        sed -i.bak "s/DB_NAME=\"\${DB_NAME:-matchit_tournaments}\"/DB_NAME=\"\${DB_NAME:-$DB_NAME}\"/g" scripts/sync-database-phase2.sh
        sed -i.bak "s/DB_USER=\"\${DB_USER:-matchit_user}\"/DB_USER=\"\${DB_USER:-$DB_USER}\"/g" scripts/sync-database-phase2.sh
        print_success "Script de sincronização atualizado"
    else
        print_warning "Script de sincronização não encontrado"
    fi
}

fix_master_script() {
    print_step "Corrigindo script master..."
    
    if [ -f "scripts/master-sync-phase2.sh" ]; then
        # Update default database name in prompts
        sed -i.bak "s/\"matchit_tournaments\"/\"$DB_NAME\"/g" scripts/master-sync-phase2.sh
        sed -i.bak "s/\"matchit_user\"/\"$DB_USER\"/g" scripts/master-sync-phase2.sh
        sed -i.bak "s/\"matchit_pass\"/\"$DB_PASSWORD\"/g" scripts/master-sync-phase2.sh
        print_success "Script master atualizado"
    else
        print_warning "Script master não encontrado"
    fi
}

fix_test_script() {
    print_step "Corrigindo script de teste..."
    
    # Create/update test script with correct credentials
    cat > scripts/test-phase2-system-fixed.sh << 'EOF'
#!/bin/bash
# scripts/test-phase2-system-fixed.sh - Teste com credenciais corretas

echo "🧪 Testando Sistema MatchIt - Fase 2 (Credenciais Corretas)..."
echo ""

# Source .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ Configurações carregadas: DB=$DB_NAME, User=$DB_USER"
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Export for psql
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export PGDATABASE="$DB_NAME"
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"

echo ""

# Test 1: Database connection
echo "1️⃣ Testando conexão com banco..."
if psql -c "SELECT 1;" >/dev/null 2>&1; then
    echo "   ✅ Banco conectado ($DB_NAME)"
else
    echo "   ❌ Falha na conexão"
    echo "   ℹ️ Verifique credenciais: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    exit 1
fi

# Test 2: Tables exist
echo "2️⃣ Verificando tabelas..."
table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
if [ "$table_count" -gt 5 ]; then
    echo "   ✅ $table_count tabelas encontradas"
else
    echo "   ⚠️ Apenas $table_count tabelas encontradas"
fi

# Test 3: Tournament tables specifically
echo "3️⃣ Verificando tabelas de torneio..."
tournament_tables=$(psql -t -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'tournament_%'
    ORDER BY table_name;
" 2>/dev/null | xargs)

if [ -n "$tournament_tables" ]; then
    echo "   ✅ Tabelas de torneio encontradas:"
    for table in $tournament_tables; do
        echo "     📊 $table"
    done
else
    echo "   ⚠️ Nenhuma tabela de torneio encontrada"
    echo "   ℹ️ Execute: ./scripts/sync-database-phase2.sh"
fi

# Test 4: Sample data
echo "4️⃣ Verificando dados de exemplo..."
if psql -c "\d tournament_images" >/dev/null 2>&1; then
    image_count=$(psql -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)
    if [ "$image_count" -gt 0 ]; then
        echo "   ✅ $image_count imagens carregadas"
        
        # Check approved images
        approved_count=$(psql -t -c "SELECT COUNT(*) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
        echo "   ✅ $approved_count imagens aprovadas"
    else
        echo "   ⚠️ Nenhuma imagem encontrada"
    fi
else
    echo "   ⚠️ Tabela tournament_images não existe"
fi

# Test 5: Categories
echo "5️⃣ Verificando categorias..."
if psql -c "\d tournament_images" >/dev/null 2>&1; then
    category_count=$(psql -t -c "SELECT COUNT(DISTINCT category) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
    if [ "$category_count" -gt 0 ]; then
        echo "   ✅ $category_count categorias com imagens aprovadas"
        
        # List categories
        categories=$(psql -t -c "SELECT DISTINCT category FROM tournament_images WHERE approved = true ORDER BY category;" 2>/dev/null | xargs)
        echo "   📋 Categorias: $categories"
    else
        echo "   ⚠️ Nenhuma categoria com imagens aprovadas"
    fi
fi

# Test 6: Critical files
echo "6️⃣ Verificando arquivos críticos..."
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
echo "📊 RESUMO:"
echo "   🗄️ Banco: $DB_NAME ($table_count tabelas)"
echo "   🏆 Torneios: $(echo $tournament_tables | wc -w) tabelas"
echo "   🖼️ Imagens: ${image_count:-0} total, ${approved_count:-0} aprovadas"
echo "   📂 Arquivos: $((${#critical_files[@]} - missing))/${#critical_files[@]} críticos"

echo ""
if [ $missing -eq 0 ] && [ "${table_count:-0}" -gt 5 ]; then
    echo "🎉 SISTEMA PRONTO PARA FASE 2!"
    echo "✅ Todos os componentes verificados"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. npm run dev"
    echo "   2. Acesse: http://localhost:3000"
    echo "   3. Teste torneios no app mobile"
else
    echo "⚠️ Sistema precisa de configuração adicional"
    if [ $missing -gt 0 ]; then
        echo "   📁 $missing arquivo(s) faltante(s)"
    fi
    if [ "${table_count:-0}" -le 5 ]; then
        echo "   🗄️ Banco precisa de sincronização"
        echo "   🔧 Execute: ./scripts/sync-database-phase2.sh"
    fi
fi
EOF

    chmod +x scripts/test-phase2-system-fixed.sh
    print_success "Script de teste corrigido criado: scripts/test-phase2-system-fixed.sh"
}

create_quick_connect_script() {
    print_step "Criando script de conexão rápida..."
    
    cat > scripts/connect-db.sh << 'EOF'
#!/bin/bash
# scripts/connect-db.sh - Conexão rápida ao banco com credenciais corretas

# Source .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Export credentials
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export PGDATABASE="$DB_NAME"
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"

echo "🔗 Conectando ao banco: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# Connect to database
psql
EOF

    chmod +x scripts/connect-db.sh
    print_success "Script de conexão criado: scripts/connect-db.sh"
}

update_migration_with_correct_db() {
    print_step "Atualizando migração definitiva para banco correto..."
    
    mkdir -p database/migrations
    
    cat > database/migrations/005_definitive_corrected_schema.sql << 'EOF'
-- database/migrations/005_definitive_corrected_schema.sql
-- Schema definitivo corrigido para o banco matchit_db

BEGIN;

-- =====================================================
-- TABELA USERS (Base) - Verificar se existe primeiro
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

-- Enum para categorias de torneio (nomes em português)
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

-- Índices para tournament_images
CREATE INDEX IF NOT EXISTS idx_tournament_images_category ON tournament_images(category);
CREATE INDEX IF NOT EXISTS idx_tournament_images_active ON tournament_images(active);
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_active_approved ON tournament_images(category, active, approved);

-- Índices para tournament_sessions
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_id ON tournament_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_status ON tournament_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user_status ON tournament_sessions(user_id, status);

-- Índices para tournament_choices
CREATE INDEX IF NOT EXISTS idx_tournament_choices_session_id ON tournament_choices(session_id);
CREATE INDEX IF NOT EXISTS idx_tournament_choices_winner_id ON tournament_choices(winner_id);

-- Índices para tournament_results
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_category ON tournament_results(category);

-- =====================================================
-- DADOS DE EXEMPLO PARA TESTE
-- =====================================================

-- Inserir usuário admin se não existir
INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
VALUES (
    'admin', 
    'admin@matchit.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Administrador MatchIt', 
    true, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste se não existir
INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
VALUES (
    'testuser', 
    'test@matchit.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Usuário de Teste', 
    false, 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir algumas imagens de exemplo para cada categoria
WITH admin_user AS (SELECT id FROM users WHERE email = 'admin@matchit.com' LIMIT 1)
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags, 
    active, approved, created_by, approved_by, upload_date, approved_at,
    file_size, image_width, image_height, mime_type,
    total_views, total_selections, win_rate
) 
SELECT 
    cat.category,
    'https://picsum.photos/400/500?random=' || ((cat.cat_num - 1) * 12 + generate_series),
    'https://picsum.photos/200/250?random=' || ((cat.cat_num - 1) * 12 + generate_series),
    cat.display_name || ' ' || generate_series,
    'Exemplo de ' || cat.display_name || ' para torneios',
    cat.sample_tags,
    true, true, admin_user.id, admin_user.id, NOW(), NOW(),
    (200000 + (generate_series * 1000))::INTEGER, 400, 500, 'image/jpeg',
    (RANDOM() * 500 + 50)::INTEGER,
    (RANDOM() * 100 + 10)::INTEGER,
    (RANDOM() * 80 + 20)::DECIMAL(5,2)
FROM (
    VALUES 
    ('cores', 'Paleta de Cores', ARRAY['vibrante', 'harmônico', 'moderno'], 1),
    ('estilos', 'Estilo Fashion', ARRAY['fashion', 'contemporâneo', 'elegante'], 2),
    ('calcados', 'Calçado Style', ARRAY['conforto', 'estilo', 'qualidade'], 3),
    ('acessorios', 'Acessório Premium', ARRAY['premium', 'sofisticado', 'versátil'], 4)
) AS cat(category, display_name, sample_tags, cat_num),
generate_series(1, 12),
admin_user
ON CONFLICT DO NOTHING;

COMMIT;
EOF

    print_success "Migração corrigida criada: database/migrations/005_definitive_corrected_schema.sql"
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    print_info "Credenciais a serem configuradas:"
    print_info "  Host: $DB_HOST"
    print_info "  Port: $DB_PORT"
    print_info "  Database: $DB_NAME"
    print_info "  User: $DB_USER"
    print_info "  Password: $DB_PASSWORD"
    echo ""
    
    # Execute fixes
    fix_env_file
    fix_sync_script
    fix_master_script
    fix_test_script
    create_quick_connect_script
    update_migration_with_correct_db
    
    # Test connection
    if test_database_connection; then
        echo -e "${GREEN}"
        echo "=========================================================================="
        echo "✅ CREDENCIAIS CORRIGIDAS COM SUCESSO!"
        echo "=========================================================================="
        echo ""
        echo "🎯 Configurações aplicadas:"
        echo "   📁 .env atualizado com credenciais corretas"
        echo "   🔧 Scripts corrigidos para usar as credenciais"
        echo "   🧪 Script de teste corrigido criado"
        echo "   🔗 Script de conexão rápida criado"
        echo "   📊 Migração corrigida criada"
        echo ""
        echo "🚀 Próximos passos:"
        echo "   1. ./scripts/test-phase2-system-fixed.sh    # Testar com credenciais corretas"
        echo "   2. ./scripts/sync-database-phase2.sh        # Sincronizar banco"
        echo "   3. ./scripts/connect-db.sh                  # Conectar ao banco diretamente"
        echo ""
        echo "🎉 Sistema pronto para usar com suas credenciais!"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        echo -e "${RED}"
        echo "=========================================================================="
        echo "⚠️ CREDENCIAIS CORRIGIDAS MAS CONEXÃO FALHOU"
        echo "=========================================================================="
        echo ""
        echo "🔧 Arquivos atualizados mas verifique:"
        echo "   1. PostgreSQL está rodando?"
        echo "   2. Banco '$DB_NAME' existe?"
        echo "   3. Usuário '$DB_USER' tem permissões?"
        echo "   4. Senha está correta?"
        echo ""
        echo "💡 Para criar o banco:"
        echo "   createdb -U $DB_USER -h $DB_HOST $DB_NAME"
        echo ""
        echo "🔗 Para conectar manualmente:"
        echo "   ./scripts/connect-db.sh"
        echo "=========================================================================="
        echo -e "${NC}"
    fi
}

# =====================================================
# EXECUÇÃO
# =====================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi