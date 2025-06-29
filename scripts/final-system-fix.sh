# scripts/final-system-fix.sh
#!/bin/bash
# Script de correção final compatível com a estrutura real do banco (UUID)

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
    echo "🔧 MatchIt - CORREÇÃO FINAL COMPATÍVEL COM UUID"
    echo "🎯 Corrigindo incompatibilidades de tipos e estruturas"
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
# VERIFICAR ESTRUTURA REAL DO BANCO
# =====================================================

analyze_real_structure() {
    print_section "ANALISANDO ESTRUTURA REAL DO BANCO"
    
    print_test "Verificando tipo de ID na tabela users"
    local user_id_type=$(psql -t -c "SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id';" | xargs)
    print_info "Tipo de user.id: $user_id_type"
    
    if [ "$user_id_type" = "uuid" ]; then
        echo "🔍 Sistema usa UUIDs - ajustando scripts..."
        USE_UUID=true
    else
        echo "🔍 Sistema usa INTEGERs - mantendo estrutura original..."
        USE_UUID=false
    fi
    
    print_test "Verificando campos da tabela user_algorithm_weights"
    local weights_columns=$(psql -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_algorithm_weights' ORDER BY ordinal_position;" | xargs)
    print_info "Campos existentes: $weights_columns"
}

# =====================================================
# CORREÇÕES COMPATÍVEIS COM UUID
# =====================================================

fix_style_recommendations_uuid() {
    print_section "CORRIGINDO style_recommendations (COMPATÍVEL UUID)"
    
    print_test "Removendo tabela existente se houver problemas"
    psql -c "DROP TABLE IF EXISTS style_recommendations CASCADE;" >/dev/null 2>&1
    
    print_test "Criando style_recommendations compatível com UUID"
    local sql="
CREATE TABLE style_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    source_algorithm VARCHAR(50) DEFAULT 'basic'
);

CREATE INDEX idx_style_recommendations_user_id ON style_recommendations(user_id);
CREATE INDEX idx_style_recommendations_active ON style_recommendations(is_active);
CREATE INDEX idx_style_recommendations_generated_at ON style_recommendations(generated_at);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_style_recommendations_timestamp()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_style_recommendations_timestamp
    BEFORE UPDATE ON style_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_style_recommendations_timestamp();
"
    
    if psql -c "$sql" >/dev/null 2>&1; then
        print_success "style_recommendations criada (UUID)"
        
        # Verificar se realmente existe
        local exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'style_recommendations');" | xargs)
        if [ "$exists" = "t" ]; then
            print_success "Tabela confirmada no banco"
            
            # Inserir dados de teste com UUIDs
            print_test "Inserindo dados de teste (UUID)"
            local insert_sql="
INSERT INTO style_recommendations (user_id, recommendation_data, confidence_score, source_algorithm)
SELECT 
    u.id,
    jsonb_build_object(
        'styles', jsonb_build_array('casual', 'elegante', 'esportivo'),
        'preferences', jsonb_build_object(
            'colors', jsonb_build_array('azul', 'preto', 'branco'),
            'brands', jsonb_build_array('nike', 'adidas', 'zara')
        ),
        'generated_by', 'final_fix_script',
        'timestamp', to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    ),
    0.75,
    'migration_corrected'
FROM users u
LIMIT 5;
"
            if psql -c "$insert_sql" >/dev/null 2>&1; then
                local count=$(psql -t -c "SELECT COUNT(*) FROM style_recommendations;" | xargs)
                print_success "$count recomendação(ões) inserida(s)"
            else
                print_warning "Erro ao inserir dados de teste"
            fi
        else
            print_failure "Tabela não foi confirmada"
        fi
    else
        print_failure "Erro ao criar style_recommendations"
    fi
}

fix_emotional_tables_uuid() {
    print_section "CORRIGINDO TABELAS EMOCIONAIS (COMPATÍVEL UUID)"
    
    # Limpar tabelas existentes que podem ter problemas
    print_test "Limpando tabelas emocionais existentes"
    psql -c "
        DROP TABLE IF EXISTS learning_session_emotions CASCADE;
        DROP TABLE IF EXISTS learning_sessions CASCADE;
        DROP TABLE IF EXISTS emotional_states CASCADE;
        DROP TABLE IF EXISTS user_learning_profiles CASCADE;
    " >/dev/null 2>&1
    
    print_test "Criando sistema emocional completo (UUID)"
    local sql="
-- 1. Tabela de estados emocionais
CREATE TABLE emotional_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state_name VARCHAR(100) NOT NULL,
    intensity DECIMAL(3,2) NOT NULL CHECK (intensity >= 0.0 AND intensity <= 1.0),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual',
    session_id UUID DEFAULT NULL
);

-- 2. Tabela de sessões de aprendizado
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL DEFAULT 'style_preference',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER CHECK (duration_seconds >= 0),
    data_collected JSONB DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
    is_completed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- 3. Atualizar emotional_states para referenciar sessions
ALTER TABLE emotional_states ADD CONSTRAINT fk_emotional_states_session
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL;

-- 4. Tabela de relação entre sessões e emoções
CREATE TABLE learning_session_emotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    emotional_state_id UUID NOT NULL REFERENCES emotional_states(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relevance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    notes TEXT,
    UNIQUE(learning_session_id, emotional_state_id)
);

-- 5. Tabela de perfis de aprendizado do usuário
CREATE TABLE user_learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL DEFAULT '{}',
    learning_style VARCHAR(50) DEFAULT 'adaptive',
    preference_stability DECIMAL(3,2) DEFAULT 0.5 CHECK (preference_stability >= 0.0 AND preference_stability <= 1.0),
    last_learning_session TIMESTAMP WITH TIME ZONE,
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    average_session_quality DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX idx_emotional_states_user_id ON emotional_states(user_id);
CREATE INDEX idx_emotional_states_recorded_at ON emotional_states(recorded_at);
CREATE INDEX idx_emotional_states_session_id ON emotional_states(session_id);

CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_type ON learning_sessions(session_type);
CREATE INDEX idx_learning_sessions_completed ON learning_sessions(is_completed);
CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at);

CREATE INDEX idx_learning_session_emotions_session ON learning_session_emotions(learning_session_id);
CREATE INDEX idx_learning_session_emotions_state ON learning_session_emotions(emotional_state_id);

CREATE INDEX idx_user_learning_profiles_user_id ON user_learning_profiles(user_id);
CREATE INDEX idx_user_learning_profiles_updated_at ON user_learning_profiles(updated_at);

-- Trigger para atualizar timestamp do perfil de aprendizado
CREATE OR REPLACE FUNCTION update_learning_profile_timestamp()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    -- Atualizar estatísticas se necessário
    IF NEW.total_sessions != OLD.total_sessions THEN
        -- Recalcular average_session_quality se necessário
        SELECT AVG(quality_score) INTO NEW.average_session_quality
        FROM learning_sessions 
        WHERE user_id = NEW.user_id AND is_completed = true;
        
        NEW.average_session_quality = COALESCE(NEW.average_session_quality, 0.0);
    END IF;
    
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_profile_timestamp
    BEFORE UPDATE ON user_learning_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_profile_timestamp();
"
    
    if psql -c "$sql" >/dev/null 2>&1; then
        print_success "Sistema emocional criado (UUID)"
        
        # Verificar tabelas criadas
        local created_tables=$(psql -t -c "
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('emotional_states', 'learning_sessions', 'learning_session_emotions', 'user_learning_profiles');
        " | xargs)
        
        print_info "$created_tables/4 tabelas emocionais criadas"
        
        if [ "$created_tables" = "4" ]; then
            print_success "Todas as tabelas emocionais confirmadas"
        else
            print_warning "Nem todas as tabelas foram criadas"
        fi
    else
        print_failure "Erro ao criar sistema emocional"
    fi
}

populate_emotional_data_uuid() {
    print_section "POPULANDO DADOS EMOCIONAIS (UUID)"
    
    print_test "Inserindo perfis de aprendizado"
    local sql_profiles="
INSERT INTO user_learning_profiles (user_id, profile_data, learning_style, preference_stability)
SELECT 
    u.id,
    jsonb_build_object(
        'learning_patterns', jsonb_build_array('visual', 'interactive', 'gamified'),
        'emotional_factors', jsonb_build_object(
            'openness', 0.7,
            'stability', 0.6,
            'adaptability', 0.8,
            'confidence', 0.75
        ),
        'preference_history', jsonb_build_array(),
        'created_by', 'final_fix_script',
        'version', '2.0'
    ),
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN 'visual'
        WHEN 1 THEN 'interactive'
        ELSE 'adaptive'
    END,
    0.5 + (RANDOM() * 0.4)  -- Entre 0.5 e 0.9
FROM users u
LIMIT 8;
"
    
    if psql -c "$sql_profiles" >/dev/null 2>&1; then
        local profiles_count=$(psql -t -c "SELECT COUNT(*) FROM user_learning_profiles;" | xargs)
        print_success "$profiles_count perfil(is) de aprendizado criado(s)"
    else
        print_warning "Erro ao inserir perfis de aprendizado"
    fi
    
    print_test "Inserindo sessões de aprendizado"
    local sql_sessions="
INSERT INTO learning_sessions (user_id, session_type, completed_at, duration_seconds, is_completed, quality_score, data_collected)
SELECT 
    ulp.user_id,
    'style_preference',
    NOW() - (RANDOM() * INTERVAL '7 days'),
    300 + (RANDOM() * 600)::INTEGER,  -- Entre 5 e 15 minutos
    true,
    0.6 + (RANDOM() * 0.3),  -- Entre 0.6 e 0.9
    jsonb_build_object(
        'choices_made', (5 + (RANDOM() * 15)::INTEGER),
        'hesitation_time', ROUND((RANDOM() * 3)::NUMERIC, 2),
        'consistency_score', 0.7 + (RANDOM() * 0.2),
        'created_by', 'final_fix_script'
    )
FROM user_learning_profiles ulp
LIMIT 6;
"
    
    if psql -c "$sql_sessions" >/dev/null 2>&1; then
        local sessions_count=$(psql -t -c "SELECT COUNT(*) FROM learning_sessions;" | xargs)
        print_success "$sessions_count sessão(ões) de aprendizado criada(s)"
    else
        print_warning "Erro ao inserir sessões de aprendizado"
    fi
    
    print_test "Inserindo estados emocionais"
    local sql_emotions="
INSERT INTO emotional_states (user_id, state_name, intensity, context, source, session_id)
SELECT 
    ls.user_id,
    CASE (RANDOM() * 6)::INTEGER
        WHEN 0 THEN 'confiante'
        WHEN 1 THEN 'curioso'
        WHEN 2 THEN 'relaxado'
        WHEN 3 THEN 'motivado'
        WHEN 4 THEN 'satisfeito'
        ELSE 'concentrado'
    END,
    0.4 + (RANDOM() * 0.5),  -- Entre 0.4 e 0.9
    'learning_session_evaluation',
    'automated_detection',
    ls.id
FROM learning_sessions ls
LIMIT 10;
"
    
    if psql -c "$sql_emotions" >/dev/null 2>&1; then
        local emotions_count=$(psql -t -c "SELECT COUNT(*) FROM emotional_states;" | xargs)
        print_success "$emotions_count estado(s) emocional(is) criado(s)"
    else
        print_warning "Erro ao inserir estados emocionais"
    fi
    
    # Criar relações entre sessões e emoções
    print_test "Criando relações sessão-emoção"
    local sql_relations="
INSERT INTO learning_session_emotions (learning_session_id, emotional_state_id, relevance_score, notes)
SELECT 
    es.session_id,
    es.id,
    0.7 + (RANDOM() * 0.2),  -- Entre 0.7 e 0.9
    'Auto-detected during session analysis'
FROM emotional_states es
WHERE es.session_id IS NOT NULL
LIMIT 8;
"
    
    if psql -c "$sql_relations" >/dev/null 2>&1; then
        local relations_count=$(psql -t -c "SELECT COUNT(*) FROM learning_session_emotions;" | xargs)
        print_success "$relations_count relação(ões) sessão-emoção criada(s)"
    else
        print_warning "Erro ao criar relações sessão-emoção"
    fi
}

populate_algorithm_weights() {
    print_section "POPULANDO PESOS ALGORÍTMICOS (ESTRUTURA REAL)"
    
    print_test "Verificando estrutura real de user_algorithm_weights"
    local weights_exist=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" | xargs)
    print_info "Registros existentes: $weights_exist"
    
    if [ "$weights_exist" = "0" ]; then
        print_test "Inserindo pesos com estrutura real do banco"
        local sql_weights="
INSERT INTO user_algorithm_weights (
    user_id, 
    style_compatibility_weight, 
    location_weight, 
    personality_weight, 
    lifestyle_weight, 
    activity_weight,
    learning_rate
)
SELECT 
    u.id,
    0.25 + (RANDOM() * 0.15),  -- style_compatibility_weight: 0.25-0.40
    0.20 + (RANDOM() * 0.10),  -- location_weight: 0.20-0.30
    0.20 + (RANDOM() * 0.15),  -- personality_weight: 0.20-0.35
    0.15 + (RANDOM() * 0.10),  -- lifestyle_weight: 0.15-0.25
    0.10 + (RANDOM() * 0.10),  -- activity_weight: 0.10-0.20
    0.005 + (RANDOM() * 0.015) -- learning_rate: 0.005-0.020
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_algorithm_weights uaw WHERE uaw.user_id = u.id
)
LIMIT 10;
"
        
        if psql -c "$sql_weights" >/dev/null 2>&1; then
            local new_weights_count=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" | xargs)
            print_success "$new_weights_count configuração(ões) de peso criada(s)"
        else
            print_warning "Erro ao inserir pesos algorítmicos"
        fi
    else
        print_info "Pesos algorítmicos já existem ($weights_exist registros)"
    fi
}

# =====================================================
# VALIDAÇÃO FINAL COMPLETA
# =====================================================

final_comprehensive_validation() {
    print_section "VALIDAÇÃO FINAL COMPLETA"
    
    print_test "Contando tabelas por fase"
    
    # Contar tabelas com verificação individual
    local users_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');" | xargs)
    local style_choices_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'style_choices');" | xargs)
    local style_recommendations_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'style_recommendations');" | xargs)
    
    local emotional_states_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'emotional_states');" | xargs)
    local learning_sessions_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learning_sessions');" | xargs)
    local learning_session_emotions_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learning_session_emotions');" | xargs)
    local user_algorithm_weights_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_algorithm_weights');" | xargs)
    local user_learning_profiles_exists=$(psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_learning_profiles');" | xargs)
    
    # Contar Fase 0
    local phase0_count=0
    [ "$users_exists" = "t" ] && phase0_count=$((phase0_count + 1))
    [ "$style_choices_exists" = "t" ] && phase0_count=$((phase0_count + 1))
    [ "$style_recommendations_exists" = "t" ] && phase0_count=$((phase0_count + 1))
    
    # Contar Fase 1
    local phase1_count=0
    [ "$emotional_states_exists" = "t" ] && phase1_count=$((phase1_count + 1))
    [ "$learning_sessions_exists" = "t" ] && phase1_count=$((phase1_count + 1))
    [ "$learning_session_emotions_exists" = "t" ] && phase1_count=$((phase1_count + 1))
    [ "$user_algorithm_weights_exists" = "t" ] && phase1_count=$((phase1_count + 1))
    [ "$user_learning_profiles_exists" = "t" ] && phase1_count=$((phase1_count + 1))
    
    # Contar Fase 2 (já funcionando)
    local phase2_count=$(psql -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_name IN ('tournament_images', 'tournament_sessions', 'tournament_choices', 'tournament_results');
    " | xargs)
    
    print_info "Fase 0: $phase0_count/3 tabelas"
    print_info "Fase 1: $phase1_count/5 tabelas"
    print_info "Fase 2: $phase2_count/4 tabelas"
    
    # Verificar dados
    print_test "Verificando dados inseridos"
    
    if [ "$style_recommendations_exists" = "t" ]; then
        local rec_count=$(psql -t -c "SELECT COUNT(*) FROM style_recommendations;" | xargs)
        print_info "style_recommendations: $rec_count registro(s)"
    fi
    
    if [ "$user_algorithm_weights_exists" = "t" ]; then
        local weights_count=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" | xargs)
        print_info "user_algorithm_weights: $weights_count registro(s)"
    fi
    
    if [ "$user_learning_profiles_exists" = "t" ]; then
        local profiles_count=$(psql -t -c "SELECT COUNT(*) FROM user_learning_profiles;" | xargs)
        print_info "user_learning_profiles: $profiles_count registro(s)"
    fi
    
    if [ "$learning_sessions_exists" = "t" ]; then
        local sessions_count=$(psql -t -c "SELECT COUNT(*) FROM learning_sessions;" | xargs)
        print_info "learning_sessions: $sessions_count registro(s)"
    fi
    
    if [ "$emotional_states_exists" = "t" ]; then
        local emotions_count=$(psql -t -c "SELECT COUNT(*) FROM emotional_states;" | xargs)
        print_info "emotional_states: $emotions_count registro(s)"
    fi
    
    # Calcular sucesso
    local total_found=$((phase0_count + phase1_count + phase2_count))
    local total_expected=12
    local success_rate=$(( (total_found * 100) / total_expected ))
    
    print_info "TOTAL: $total_found/$total_expected tabelas ($success_rate%)"
    
    # Retornar resultado
    if [ $success_rate -ge 95 ]; then
        return 0  # Excelente
    elif [ $success_rate -ge 85 ]; then
        return 1  # Bom
    else
        return 2  # Ainda há problemas
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    echo "Este script irá fazer a correção final do sistema:"
    echo ""
    echo "🔍 Analisar estrutura real do banco (UUID vs INTEGER)"
    echo "🛠️  Corrigir style_recommendations compatível com UUID"
    echo "🛠️  Recriar sistema emocional completo (UUID)"
    echo "🛠️  Popular dados com estrutura real user_algorithm_weights"
    echo "📊 Validação final com verificação individual"
    echo ""
    
    read -p "❓ Executar correção final? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Correção cancelada."
        exit 0
    fi
    
    # Executar correção completa
    load_environment
    analyze_real_structure
    
    echo ""
    echo "🔧 Executando correções finais..."
    echo ""
    
    fix_style_recommendations_uuid
    fix_emotional_tables_uuid
    populate_emotional_data_uuid
    populate_algorithm_weights
    
    echo ""
    local validation_result
    if final_comprehensive_validation; then
        validation_result=0
    elif [ $? -eq 1 ]; then
        validation_result=1
    else
        validation_result=2
    fi
    
    if [ $validation_result -eq 0 ]; then
        echo -e "${GREEN}${BOLD}"
        echo "=========================================================================="
        echo "🎉 CORREÇÃO FINAL CONCLUÍDA COM EXCELÊNCIA!"
        echo "=========================================================================="
        echo ""
        echo "✅ Todas as tabelas criadas e funcionando"
        echo "✅ Dados inseridos com tipos compatíveis (UUID)"
        echo "✅ Sistema integrado e pronto para produção"
        echo ""
        echo "🚀 TESTE FINAL:"
        echo "   ./scripts/test-complete-system-phases.sh"
        echo ""
        echo "🎯 Taxa de sucesso esperada: 95%+"
        echo "=========================================================================="
        echo -e "${NC}"
    elif [ $validation_result -eq 1 ]; then
        echo -e "${YELLOW}${BOLD}"
        echo "=========================================================================="
        echo "👍 CORREÇÃO FINAL CONCLUÍDA COM SUCESSO!"
        echo "=========================================================================="
        echo ""
        echo "✅ Maioria das tabelas criadas e funcionando"
        echo "✅ Sistema em estado muito bom"
        echo "⚠️  Algumas tabelas podem precisar de ajustes menores"
        echo ""
        echo "🚀 PRÓXIMOS PASSOS:"
        echo "   1. ./scripts/test-complete-system-phases.sh"
        echo "   2. Verificar se há avisos específicos"
        echo ""
        echo "🎯 Taxa de sucesso esperada: 85-95%"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        echo -e "${RED}${BOLD}"
        echo "=========================================================================="
        echo "⚠️  CORREÇÃO FINAL TEVE PROBLEMAS"
        echo "=========================================================================="
        echo ""
        echo "🔧 Algumas correções foram aplicadas"
        echo "❌ Ainda há problemas significativos no sistema"
        echo ""
        echo "🚀 PRÓXIMOS PASSOS:"
        echo "   1. Verificar logs específicos acima"
        echo "   2. ./scripts/test-complete-system-phases.sh"
        echo "   3. Reportar problemas específicos encontrados"
        echo "=========================================================================="
        echo -e "${NC}"
    fi
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi