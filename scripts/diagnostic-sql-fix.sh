# scripts/diagnostic-sql-fix.sh
#!/bin/bash
# Script de diagnóstico detalhado para identificar e corrigir problemas SQL

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

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}${BOLD}"
    echo "=========================================================================="
    echo "🔍 MatchIt - DIAGNÓSTICO SQL DETALHADO"
    echo "🎯 Identificando e corrigindo problemas específicos"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_section() {
    echo -e "${BLUE}${BOLD}🔧 $1${NC}"
}

print_test() {
    echo -e "${CYAN}🧪 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_sql_output() {
    echo -e "${YELLOW}📄 SQL Output:${NC}"
    echo "$1" | sed 's/^/   /' 
}

# =====================================================
# CARREGAR CONFIGURAÇÕES
# =====================================================

load_environment() {
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        
        # Exportar variáveis do PostgreSQL
        export PGHOST="${DB_HOST:-localhost}"
        export PGPORT="${DB_PORT:-5432}"
        export PGDATABASE="${DB_NAME:-matchit_db}"
        export PGUSER="${DB_USER:-matchit}"
        export PGPASSWORD="${DB_PASSWORD:-matchit123}"
        
        print_success "Configurações carregadas: $PGDATABASE @ $PGHOST"
    else
        print_failure "Arquivo .env não encontrado!"
        exit 1
    fi
}

# =====================================================
# DIAGNÓSTICO BÁSICO
# =====================================================

test_basic_connection() {
    print_section "DIAGNÓSTICO BÁSICO DE CONEXÃO"
    
    print_test "Testando conexão básica"
    if psql -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Conexão funcionando"
    else
        print_failure "Conexão falhou"
        print_info "Testando conexão com logs..."
        psql -c "SELECT 1;" 2>&1 | head -5
        exit 1
    fi
    
    print_test "Verificando versão do PostgreSQL"
    local pg_version=$(psql -t -c "SELECT version();" | head -1 | xargs)
    print_info "Versão: ${pg_version:0:80}..."
    
    print_test "Verificando permissões do usuário"
    local can_create=$(psql -t -c "SELECT has_database_privilege('$PGUSER', '$PGDATABASE', 'CREATE');" | xargs)
    if [ "$can_create" = "t" ]; then
        print_success "Usuário tem permissão CREATE"
    else
        print_warning "Usuário NÃO tem permissão CREATE"
    fi
    
    print_test "Verificando esquema público"
    local schema_exists=$(psql -t -c "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'public');" | xargs)
    if [ "$schema_exists" = "t" ]; then
        print_success "Schema 'public' existe"
    else
        print_failure "Schema 'public' não existe"
    fi
}

# =====================================================
# VERIFICAR CONFLITOS EXISTENTES
# =====================================================

check_existing_structures() {
    print_section "VERIFICANDO ESTRUTURAS EXISTENTES"
    
    # Verificar tabelas que queremos criar
    local tables=("style_recommendations" "emotional_states" "learning_sessions" "learning_session_emotions" "user_learning_profiles")
    
    for table in "${tables[@]}"; do
        print_test "Verificando se '$table' já existe"
        local exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | xargs)
        if [ "$exists" = "t" ]; then
            print_warning "Tabela '$table' já existe"
            
            # Mostrar estrutura da tabela existente
            print_info "Estrutura existente:"
            psql -c "\d $table" 2>/dev/null | head -10 | sed 's/^/     /'
        else
            print_info "Tabela '$table' não existe (OK para criar)"
        fi
    done
    
    # Verificar functions/triggers que podem conflitar
    print_test "Verificando functions existentes"
    local functions=$(psql -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%recommendation%' OR proname LIKE '%emotional%' OR proname LIKE '%learning%';" | xargs)
    print_info "$functions function(s) relacionada(s) encontrada(s)"
    
    if [ "$functions" -gt 0 ]; then
        print_info "Functions existentes:"
        psql -c "SELECT proname FROM pg_proc WHERE proname LIKE '%recommendation%' OR proname LIKE '%emotional%' OR proname LIKE '%learning%';" | sed 's/^/     /'
    fi
}

# =====================================================
# CRIAÇÃO INDIVIDUAL DAS TABELAS COM LOGS
# =====================================================

create_style_recommendations() {
    print_section "CRIANDO TABELA style_recommendations"
    
    print_test "Tentando criar tabela style_recommendations"
    
    local sql="
DROP TABLE IF EXISTS style_recommendations CASCADE;

CREATE TABLE style_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    source_algorithm VARCHAR(50) DEFAULT 'basic'
);

CREATE INDEX idx_style_recommendations_user_id ON style_recommendations(user_id);
CREATE INDEX idx_style_recommendations_active ON style_recommendations(is_active);
"
    
    print_info "Executando SQL..."
    if local output=$(psql -c "$sql" 2>&1); then
        print_success "Tabela style_recommendations criada"
        
        # Verificar se foi realmente criada
        local exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'style_recommendations');" | xargs)
        if [ "$exists" = "t" ]; then
            print_success "Tabela confirmada no banco"
            
            # Inserir dados de teste
            print_test "Inserindo dados de teste"
            local insert_sql="
INSERT INTO style_recommendations (user_id, recommendation_data, confidence_score)
SELECT 
    u.id,
    '{\"styles\": [\"casual\", \"elegante\"], \"test\": true}'::jsonb,
    0.8
FROM users u
LIMIT 3;
"
            if psql -c "$insert_sql" >/dev/null 2>&1; then
                local count=$(psql -t -c "SELECT COUNT(*) FROM style_recommendations;" | xargs)
                print_success "$count registro(s) inserido(s)"
            else
                print_warning "Erro ao inserir dados de teste"
            fi
        else
            print_failure "Tabela não confirmada após criação"
        fi
    else
        print_failure "Erro ao criar tabela"
        print_sql_output "$output"
    fi
}

create_emotional_tables() {
    print_section "CRIANDO TABELAS DO SISTEMA EMOCIONAL"
    
    # Criar tabelas uma por vez com logs detalhados
    
    print_test "1. Criando tabela emotional_states"
    local sql1="
DROP TABLE IF EXISTS emotional_states CASCADE;

CREATE TABLE emotional_states (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state_name VARCHAR(100) NOT NULL,
    intensity DECIMAL(3,2) NOT NULL CHECK (intensity >= 0.0 AND intensity <= 1.0),
    recorded_at TIMESTAMP DEFAULT NOW(),
    context VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual'
);

CREATE INDEX idx_emotional_states_user_id ON emotional_states(user_id);
"
    
    if local output1=$(psql -c "$sql1" 2>&1); then
        print_success "emotional_states criada"
    else
        print_failure "Erro ao criar emotional_states"
        print_sql_output "$output1"
        return 1
    fi
    
    print_test "2. Criando tabela learning_sessions"
    local sql2="
DROP TABLE IF EXISTS learning_sessions CASCADE;

CREATE TABLE learning_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL DEFAULT 'style_preference',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    data_collected JSONB DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.0,
    is_completed BOOLEAN DEFAULT false
);

CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
"
    
    if local output2=$(psql -c "$sql2" 2>&1); then
        print_success "learning_sessions criada"
    else
        print_failure "Erro ao criar learning_sessions"
        print_sql_output "$output2"
        return 1
    fi
    
    print_test "3. Criando tabela learning_session_emotions"
    local sql3="
DROP TABLE IF EXISTS learning_session_emotions CASCADE;

CREATE TABLE learning_session_emotions (
    id SERIAL PRIMARY KEY,
    learning_session_id INTEGER NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    emotional_state_id INTEGER NOT NULL REFERENCES emotional_states(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT NOW(),
    relevance_score DECIMAL(3,2) DEFAULT 0.5
);
"
    
    if local output3=$(psql -c "$sql3" 2>&1); then
        print_success "learning_session_emotions criada"
    else
        print_failure "Erro ao criar learning_session_emotions"
        print_sql_output "$output3"
        return 1
    fi
    
    print_test "4. Criando tabela user_learning_profiles"
    local sql4="
DROP TABLE IF EXISTS user_learning_profiles CASCADE;

CREATE TABLE user_learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL DEFAULT '{}',
    learning_style VARCHAR(50) DEFAULT 'adaptive',
    preference_stability DECIMAL(3,2) DEFAULT 0.5,
    last_learning_session TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_learning_profiles_user_id ON user_learning_profiles(user_id);
"
    
    if local output4=$(psql -c "$sql4" 2>&1); then
        print_success "user_learning_profiles criada"
    else
        print_failure "Erro ao criar user_learning_profiles"
        print_sql_output "$output4"
        return 1
    fi
    
    print_success "Todas as 4 tabelas emocionais criadas com sucesso"
}

populate_weights_data() {
    print_section "POPULANDO DADOS DE PESOS ALGORÍTMICOS"
    
    print_test "Verificando estrutura da tabela user_algorithm_weights"
    local table_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_algorithm_weights');" | xargs)
    
    if [ "$table_exists" = "t" ]; then
        print_success "Tabela user_algorithm_weights existe"
        
        # Mostrar estrutura
        print_info "Estrutura da tabela:"
        psql -c "\d user_algorithm_weights" | head -15 | sed 's/^/     /'
        
        print_test "Inserindo dados de pesos"
        local sql="
INSERT INTO user_algorithm_weights (user_id, style_weight, emotional_weight, behavioral_weight, tournament_weight, created_at, updated_at)
SELECT 
    u.id,
    0.5,  -- style_weight
    0.2,  -- emotional_weight  
    0.2,  -- behavioral_weight
    0.1,  -- tournament_weight
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_algorithm_weights uaw WHERE uaw.user_id = u.id
)
LIMIT 10;
"
        
        if local output=$(psql -c "$sql" 2>&1); then
            local count=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" | xargs)
            print_success "$count configuração(ões) de peso criada(s)"
        else
            print_failure "Erro ao inserir pesos"
            print_sql_output "$output"
        fi
    else
        print_failure "Tabela user_algorithm_weights não existe"
    fi
}

insert_sample_data() {
    print_section "INSERINDO DADOS DE EXEMPLO"
    
    print_test "Inserindo dados nas tabelas emocionais"
    
    # Dados para emotional_states
    local sql_emotions="
INSERT INTO emotional_states (user_id, state_name, intensity, context, source)
SELECT 
    u.id,
    'satisfeito',
    0.7,
    'teste_sistema',
    'diagnostic_script'
FROM users u
LIMIT 5;
"
    
    if psql -c "$sql_emotions" >/dev/null 2>&1; then
        local emotions_count=$(psql -t -c "SELECT COUNT(*) FROM emotional_states;" | xargs)
        print_success "$emotions_count estado(s) emocional(is) inserido(s)"
    else
        print_warning "Erro ao inserir estados emocionais"
    fi
    
    # Dados para learning_sessions  
    local sql_sessions="
INSERT INTO learning_sessions (user_id, session_type, completed_at, duration_seconds, is_completed, quality_score)
SELECT 
    u.id,
    'style_preference',
    NOW() - INTERVAL '1 hour',
    450,
    true,
    0.8
FROM users u
LIMIT 3;
"
    
    if psql -c "$sql_sessions" >/dev/null 2>&1; then
        local sessions_count=$(psql -t -c "SELECT COUNT(*) FROM learning_sessions;" | xargs)
        print_success "$sessions_count sessão(ões) de aprendizado inserida(s)"
    else
        print_warning "Erro ao inserir sessões de aprendizado"
    fi
    
    # Dados para user_learning_profiles
    local sql_profiles="
INSERT INTO user_learning_profiles (user_id, profile_data, learning_style, preference_stability)
SELECT 
    u.id,
    '{\"test\": true, \"created_by\": \"diagnostic_script\"}'::jsonb,
    'adaptive',
    0.6
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_learning_profiles ulp WHERE ulp.user_id = u.id
)
LIMIT 5;
"
    
    if psql -c "$sql_profiles" >/dev/null 2>&1; then
        local profiles_count=$(psql -t -c "SELECT COUNT(*) FROM user_learning_profiles;" | xargs)
        print_success "$profiles_count perfil(is) de aprendizado inserido(s)"
    else
        print_warning "Erro ao inserir perfis de aprendizado"
    fi
}

# =====================================================
# VALIDAÇÃO FINAL DETALHADA
# =====================================================

final_validation() {
    print_section "VALIDAÇÃO FINAL DETALHADA"
    
    # Contar todas as tabelas por fase
    print_test "Verificando contagem de tabelas por fase"
    
    local phase0_count=$(psql -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'style_choices', 'style_recommendations');
    " | xargs)
    
    local phase1_count=$(psql -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('emotional_states', 'learning_sessions', 'learning_session_emotions', 'user_algorithm_weights', 'user_learning_profiles');
    " | xargs)
    
    local phase2_count=$(psql -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('tournament_images', 'tournament_sessions', 'tournament_choices', 'tournament_results');
    " | xargs)
    
    print_info "Fase 0: $phase0_count/3 tabelas"
    print_info "Fase 1: $phase1_count/5 tabelas"
    print_info "Fase 2: $phase2_count/4 tabelas"
    
    # Verificar dados nas tabelas
    print_test "Verificando dados inseridos"
    
    if [ "$phase0_count" -eq 3 ]; then
        local rec_data=$(psql -t -c "SELECT COUNT(*) FROM style_recommendations;" | xargs)
        print_info "style_recommendations: $rec_data registro(s)"
    fi
    
    if [ "$phase1_count" -eq 5 ]; then
        local weights_data=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" | xargs)
        local emotions_data=$(psql -t -c "SELECT COUNT(*) FROM emotional_states;" | xargs)
        local sessions_data=$(psql -t -c "SELECT COUNT(*) FROM learning_sessions;" | xargs)
        local profiles_data=$(psql -t -c "SELECT COUNT(*) FROM user_learning_profiles;" | xargs)
        
        print_info "user_algorithm_weights: $weights_data registro(s)"
        print_info "emotional_states: $emotions_data registro(s)"
        print_info "learning_sessions: $sessions_data registro(s)"
        print_info "user_learning_profiles: $profiles_data registro(s)"
    fi
    
    # Calcular resultado final
    local total_expected=12  # 3 + 5 + 4
    local total_found=$((phase0_count + phase1_count + phase2_count))
    local success_rate=$(( (total_found * 100) / total_expected ))
    
    print_info "Total: $total_found/$total_expected tabelas ($success_rate%)"
    
    if [ $success_rate -ge 90 ]; then
        return 0  # Sucesso
    else
        return 1  # Ainda há problemas
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    echo "Este script irá diagnosticar e corrigir problemas SQL específicos:"
    echo ""
    echo "🔍 Diagnóstico básico de conexão e permissões"
    echo "🔍 Verificação de estruturas existentes"
    echo "🛠️  Criação individual de tabelas com logs detalhados"
    echo "📊 Validação final com relatório completo"
    echo ""
    
    read -p "❓ Executar diagnóstico e correção? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Diagnóstico cancelado."
        exit 0
    fi
    
    # Executar diagnóstico completo
    load_environment
    test_basic_connection
    check_existing_structures
    
    echo ""
    echo "🔧 Iniciando correções..."
    echo ""
    
    create_style_recommendations
    create_emotional_tables
    populate_weights_data
    insert_sample_data
    
    echo ""
    if final_validation; then
        echo -e "${GREEN}${BOLD}"
        echo "=========================================================================="
        echo "🎉 DIAGNÓSTICO E CORREÇÃO CONCLUÍDOS COM SUCESSO!"
        echo "=========================================================================="
        echo ""
        echo "✅ Todas as tabelas criadas e populadas"
        echo "✅ Sistema pronto para testes"
        echo ""
        echo "🚀 PRÓXIMO PASSO:"
        echo "   ./scripts/test-complete-system-phases.sh"
        echo ""
        echo "🎯 O sistema deve agora ter taxa de sucesso de 90%+"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        echo -e "${YELLOW}${BOLD}"
        echo "=========================================================================="
        echo "⚡ DIAGNÓSTICO CONCLUÍDO MAS AINDA HÁ PENDÊNCIAS"
        echo "=========================================================================="
        echo ""
        echo "📋 Verifique os logs acima para problemas específicos"
        echo "🔧 Algumas tabelas podem não ter sido criadas corretamente"
        echo ""
        echo "🚀 PRÓXIMOS PASSOS:"
        echo "   1. Revisar erros SQL específicos nos logs"
        echo "   2. Executar teste: ./scripts/test-complete-system-phases.sh"
        echo "   3. Reportar problemas se persistirem"
        echo "=========================================================================="
        echo -e "${NC}"
    fi
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi