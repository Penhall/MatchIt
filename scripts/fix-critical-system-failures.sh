# scripts/fix-critical-system-failures.sh
#!/bin/bash
# Script para corrigir todas as falhas críticas identificadas no teste completo

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

# Contadores
FIXES_APPLIED=0
TOTAL_FIXES=0

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}${BOLD}"
    echo "=========================================================================="
    echo "🔧 MatchIt - CORREÇÃO DE FALHAS CRÍTICAS"
    echo "🎯 Corrigindo problemas identificados no teste completo"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_section() {
    echo -e "${BLUE}${BOLD}🔧 $1${NC}"
}

print_fix() {
    echo -n "   🛠️  $1... "
    TOTAL_FIXES=$((TOTAL_FIXES + 1))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
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
        
        print_info "Configurações carregadas: $PGDATABASE @ $PGHOST"
    else
        echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
        exit 1
    fi
}

# =====================================================
# CORREÇÕES DA FASE 0
# =====================================================

fix_phase_0_missing_tables() {
    print_section "CORRIGINDO FASE 0 - Tabelas Faltantes"
    
    print_fix "Criando tabela 'style_recommendations'"
    
    local sql_create_recommendations="
-- Tabela para armazenar recomendações de estilo geradas pelo sistema
CREATE TABLE IF NOT EXISTS style_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    source_algorithm VARCHAR(50) DEFAULT 'basic',
    
    -- Índices para performance
    CONSTRAINT unique_active_recommendation_per_user UNIQUE (user_id, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_style_recommendations_user_id ON style_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_style_recommendations_active ON style_recommendations(is_active);
CREATE INDEX IF NOT EXISTS idx_style_recommendations_generated_at ON style_recommendations(generated_at);
CREATE INDEX IF NOT EXISTS idx_style_recommendations_confidence ON style_recommendations(confidence_score);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_style_recommendations_timestamp()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- Trigger para auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_style_recommendations_timestamp ON style_recommendations;
CREATE TRIGGER trigger_update_style_recommendations_timestamp
    BEFORE UPDATE ON style_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_style_recommendations_timestamp();

-- Inserir dados básicos para usuários existentes
INSERT INTO style_recommendations (user_id, recommendation_data, confidence_score, source_algorithm)
SELECT 
    u.id,
    jsonb_build_object(
        'styles', jsonb_build_array('casual', 'elegante', 'esportivo'),
        'preferences', jsonb_build_object(
            'colors', jsonb_build_array('azul', 'preto', 'branco'),
            'brands', jsonb_build_array('nike', 'adidas', 'zara')
        ),
        'generated_by', 'migration_script'
    ),
    0.75,
    'migration_baseline'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM style_recommendations sr WHERE sr.user_id = u.id AND sr.is_active = true
)
LIMIT 10; -- Limitar para não sobrecarregar
"
    
    if psql -c "$sql_create_recommendations" >/dev/null 2>&1; then
        print_success "Tabela style_recommendations criada e populada"
        
        # Verificar dados
        local rec_count=$(psql -t -c "SELECT COUNT(*) FROM style_recommendations;" | xargs)
        print_info "$rec_count recomendação(ões) criada(s)"
    else
        print_failure "Erro ao criar tabela style_recommendations"
    fi
}

# =====================================================
# CORREÇÕES DA FASE 1
# =====================================================

fix_phase_1_missing_tables() {
    print_section "CORRIGINDO FASE 1 - Sistema de Perfil Emocional"
    
    print_fix "Criando tabelas do sistema emocional"
    
    local sql_emotional_system="
-- Tabela de estados emocionais
CREATE TABLE IF NOT EXISTS emotional_states (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state_name VARCHAR(100) NOT NULL,
    intensity DECIMAL(3,2) NOT NULL CHECK (intensity >= 0.0 AND intensity <= 1.0),
    recorded_at TIMESTAMP DEFAULT NOW(),
    context VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual',
    
    -- Evitar duplicatas na mesma sessão
    UNIQUE(user_id, state_name, recorded_at)
);

-- Tabela de sessões de aprendizado
CREATE TABLE IF NOT EXISTS learning_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL DEFAULT 'style_preference',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    data_collected JSONB DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.0,
    is_completed BOOLEAN DEFAULT false,
    
    -- Índices
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- Tabela de relação entre sessões e emoções
CREATE TABLE IF NOT EXISTS learning_session_emotions (
    id SERIAL PRIMARY KEY,
    learning_session_id INTEGER NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    emotional_state_id INTEGER NOT NULL REFERENCES emotional_states(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT NOW(),
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    
    -- Evitar duplicatas
    UNIQUE(learning_session_id, emotional_state_id)
);

-- Tabela de perfis de aprendizado do usuário
CREATE TABLE IF NOT EXISTS user_learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL DEFAULT '{}',
    learning_style VARCHAR(50) DEFAULT 'adaptive',
    preference_stability DECIMAL(3,2) DEFAULT 0.5,
    last_learning_session TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Um perfil por usuário
    UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_emotional_states_user_id ON emotional_states(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_recorded_at ON emotional_states(recorded_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_type ON learning_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_completed ON learning_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_learning_profiles_user_id ON user_learning_profiles(user_id);

-- Triggers para atualizar timestamps
CREATE OR REPLACE FUNCTION update_learning_profile_timestamp()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_learning_profile_timestamp ON user_learning_profiles;
CREATE TRIGGER trigger_update_learning_profile_timestamp
    BEFORE UPDATE ON user_learning_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_profile_timestamp();

-- Popular dados básicos
INSERT INTO user_learning_profiles (user_id, profile_data, learning_style, preference_stability)
SELECT 
    u.id,
    jsonb_build_object(
        'learning_patterns', jsonb_build_array('visual', 'interactive'),
        'emotional_factors', jsonb_build_object(
            'openness', 0.7,
            'stability', 0.6,
            'adaptability', 0.8
        ),
        'preference_history', jsonb_build_array(),
        'created_by', 'migration_script'
    ),
    'adaptive',
    0.6
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_learning_profiles ulp WHERE ulp.user_id = u.id
)
LIMIT 10;

-- Inserir algumas sessões de exemplo
INSERT INTO learning_sessions (user_id, session_type, completed_at, duration_seconds, is_completed, quality_score)
SELECT 
    u.id,
    'style_preference',
    NOW() - INTERVAL '1 day',
    300 + (RANDOM() * 600)::INTEGER,
    true,
    0.6 + (RANDOM() * 0.3)
FROM users u
ORDER BY u.id
LIMIT 5;

-- Inserir alguns estados emocionais de exemplo
INSERT INTO emotional_states (user_id, state_name, intensity, context, source)
SELECT 
    u.id,
    CASE (RANDOM() * 5)::INTEGER
        WHEN 0 THEN 'confiante'
        WHEN 1 THEN 'curioso'
        WHEN 2 THEN 'relaxado'
        WHEN 3 THEN 'motivado'
        ELSE 'satisfeito'
    END,
    0.4 + (RANDOM() * 0.5),
    'session_evaluation',
    'automated'
FROM users u
ORDER BY u.id
LIMIT 10;
"
    
    if psql -c "$sql_emotional_system" >/dev/null 2>&1; then
        print_success "Sistema emocional criado e populado"
        
        # Verificar dados
        local profiles_count=$(psql -t -c "SELECT COUNT(*) FROM user_learning_profiles;" | xargs)
        local sessions_count=$(psql -t -c "SELECT COUNT(*) FROM learning_sessions;" | xargs)
        local emotions_count=$(psql -t -c "SELECT COUNT(*) FROM emotional_states;" | xargs)
        
        print_info "$profiles_count perfil(is) de aprendizado criado(s)"
        print_info "$sessions_count sessão(ões) de aprendizado criada(s)"
        print_info "$emotions_count estado(s) emocional(is) criado(s)"
    else
        print_failure "Erro ao criar sistema emocional"
    fi
}

fix_phase_1_weights_data() {
    print_fix "Populando dados de pesos algorítmicos"
    
    local sql_weights="
-- Popular user_algorithm_weights com dados básicos
INSERT INTO user_algorithm_weights (user_id, style_weight, emotional_weight, behavioral_weight, tournament_weight, created_at, updated_at)
SELECT 
    u.id,
    0.4 + (RANDOM() * 0.3),  -- style_weight entre 0.4 e 0.7
    0.2 + (RANDOM() * 0.2),  -- emotional_weight entre 0.2 e 0.4
    0.2 + (RANDOM() * 0.2),  -- behavioral_weight entre 0.2 e 0.4
    0.2 + (RANDOM() * 0.3),  -- tournament_weight entre 0.2 e 0.5
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_algorithm_weights uaw WHERE uaw.user_id = u.id
)
LIMIT 15;
"
    
    if psql -c "$sql_weights" >/dev/null 2>&1; then
        local weights_count=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" | xargs)
        print_success "$weights_count configuração(ões) de peso criada(s)"
    else
        print_failure "Erro ao popular pesos algorítmicos"
    fi
}

# =====================================================
# CORREÇÕES DE INTEGRAÇÃO
# =====================================================

fix_integration_issues() {
    print_section "CORRIGINDO PROBLEMAS DE INTEGRAÇÃO"
    
    print_fix "Verificando e corrigindo relacionamentos"
    
    # Criar view para verificar integrações
    local sql_integration="
-- View para monitorar integrações entre fases
CREATE OR REPLACE VIEW user_integration_status AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    -- Fase 0
    CASE WHEN sc.id IS NOT NULL THEN true ELSE false END as has_style_choices,
    CASE WHEN sr.id IS NOT NULL THEN true ELSE false END as has_style_recommendations,
    -- Fase 1
    CASE WHEN ulp.id IS NOT NULL THEN true ELSE false END as has_learning_profile,
    CASE WHEN uaw.id IS NOT NULL THEN true ELSE false END as has_algorithm_weights,
    -- Fase 2
    CASE WHEN ts.id IS NOT NULL THEN true ELSE false END as has_tournament_sessions,
    -- Contadores
    COALESCE(ls_count.count, 0) as learning_sessions_count,
    COALESCE(es_count.count, 0) as emotional_states_count
FROM users u
LEFT JOIN style_choices sc ON u.id = sc.user_id
LEFT JOIN style_recommendations sr ON u.id = sr.user_id AND sr.is_active = true
LEFT JOIN user_learning_profiles ulp ON u.id = ulp.user_id  
LEFT JOIN user_algorithm_weights uaw ON u.id = uaw.user_id
LEFT JOIN tournament_sessions ts ON u.id = ts.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM learning_sessions 
    GROUP BY user_id
) ls_count ON u.id = ls_count.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM emotional_states 
    GROUP BY user_id
) es_count ON u.id = es_count.user_id;

-- Função para relatório de integração
CREATE OR REPLACE FUNCTION get_integration_report()
RETURNS TABLE(
    metric VARCHAR,
    count INTEGER,
    percentage DECIMAL
) AS \$\$
DECLARE
    total_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    
    RETURN QUERY
    SELECT 
        'Total Users'::VARCHAR,
        total_users,
        100.0::DECIMAL
    UNION ALL
    SELECT 
        'Users with Style Choices'::VARCHAR,
        (SELECT COUNT(*) FROM user_integration_status WHERE has_style_choices = true)::INTEGER,
        ROUND((SELECT COUNT(*) FROM user_integration_status WHERE has_style_choices = true) * 100.0 / total_users, 2)
    UNION ALL
    SELECT 
        'Users with Style Recommendations'::VARCHAR,
        (SELECT COUNT(*) FROM user_integration_status WHERE has_style_recommendations = true)::INTEGER,
        ROUND((SELECT COUNT(*) FROM user_integration_status WHERE has_style_recommendations = true) * 100.0 / total_users, 2)
    UNION ALL
    SELECT 
        'Users with Learning Profile'::VARCHAR,
        (SELECT COUNT(*) FROM user_integration_status WHERE has_learning_profile = true)::INTEGER,
        ROUND((SELECT COUNT(*) FROM user_integration_status WHERE has_learning_profile = true) * 100.0 / total_users, 2)
    UNION ALL
    SELECT 
        'Users with Algorithm Weights'::VARCHAR,
        (SELECT COUNT(*) FROM user_integration_status WHERE has_algorithm_weights = true)::INTEGER,
        ROUND((SELECT COUNT(*) FROM user_integration_status WHERE has_algorithm_weights = true) * 100.0 / total_users, 2)
    UNION ALL
    SELECT 
        'Users with Tournament Sessions'::VARCHAR,
        (SELECT COUNT(*) FROM user_integration_status WHERE has_tournament_sessions = true)::INTEGER,
        ROUND((SELECT COUNT(*) FROM user_integration_status WHERE has_tournament_sessions = true) * 100.0 / total_users, 2);
END;
\$\$ LANGUAGE plpgsql;
"

    if psql -c "$sql_integration" >/dev/null 2>&1; then
        print_success "Views e funções de integração criadas"
        
        # Executar relatório
        print_info "Relatório de integração:"
        psql -c "SELECT metric, count, percentage || '%' as percentage FROM get_integration_report();" | head -10
    else
        print_failure "Erro ao criar views de integração"
    fi
}

# =====================================================
# CORREÇÕES DE ESTRUTURA
# =====================================================

fix_script_permissions() {
    print_section "CORRIGINDO PERMISSÕES DE SCRIPTS"
    
    local scripts=(
        "scripts/fix-phase2-db-credentials.sh"
        "scripts/test-complete-system-phases.sh"
        "scripts/master-sync-phase2.sh"
        "scripts/test-db-connection.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            print_fix "Corrigindo permissões de '$script'"
            if chmod +x "$script"; then
                print_success "Permissões corrigidas"
            else
                print_failure "Erro ao corrigir permissões"
            fi
        fi
    done
}

# =====================================================
# VALIDAÇÃO FINAL
# =====================================================

run_validation() {
    print_section "VALIDAÇÃO FINAL"
    
    print_fix "Executando validação das correções"
    
    # Contar tabelas por fase
    local phase0_tables=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'style_choices', 'style_recommendations');" | xargs)
    local phase1_tables=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('emotional_states', 'learning_sessions', 'learning_session_emotions', 'user_algorithm_weights', 'user_learning_profiles');" | xargs)
    local phase2_tables=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('tournament_images', 'tournament_sessions', 'tournament_choices', 'tournament_results');" | xargs)
    
    print_success "Validação concluída"
    print_info "Fase 0: $phase0_tables/3 tabelas"
    print_info "Fase 1: $phase1_tables/5 tabelas" 
    print_info "Fase 2: $phase2_tables/4 tabelas"
    
    # Verificar se podemos executar o teste completo novamente
    if [ "$phase0_tables" -eq 3 ] && [ "$phase1_tables" -eq 5 ] && [ "$phase2_tables" -eq 4 ]; then
        print_success "Todas as tabelas críticas estão presentes!"
        return 0
    else
        print_warning "Algumas tabelas ainda estão faltando"
        return 1
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    echo "Este script irá corrigir todas as falhas críticas identificadas:"
    echo ""
    echo "❌ Fase 0: Criar tabela 'style_recommendations'"
    echo "❌ Fase 1: Criar tabelas do sistema emocional"
    echo "❌ Fase 1: Popular dados de pesos algorítmicos"
    echo "⚠️  Integração: Corrigir relacionamentos e criar views"
    echo "⚠️  Estrutura: Corrigir permissões de scripts"
    echo ""
    
    read -p "❓ Aplicar todas as correções? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Correções canceladas."
        exit 0
    fi
    
    # Carregar configurações
    load_environment
    
    # Executar correções
    fix_phase_0_missing_tables
    fix_phase_1_missing_tables  
    fix_phase_1_weights_data
    fix_integration_issues
    fix_script_permissions
    
    # Validação final
    if run_validation; then
        echo -e "${GREEN}${BOLD}"
        echo ""
        echo "=========================================================================="
        echo "🎉 TODAS AS CORREÇÕES APLICADAS COM SUCESSO!"
        echo "=========================================================================="
        echo ""
        echo "✅ $FIXES_APPLIED de $TOTAL_FIXES correções aplicadas"
        echo "✅ Todas as tabelas críticas criadas"
        echo "✅ Dados básicos populados para teste"
        echo "✅ Integrações corrigidas"
        echo "✅ Permissões de scripts corrigidas"
        echo ""
        echo "🚀 PRÓXIMOS PASSOS:"
        echo "   1. ./scripts/test-complete-system-phases.sh  # Executar teste novamente"
        echo "   2. Verificar se a taxa de sucesso melhorou"
        echo "   3. Continuar desenvolvimento das funcionalidades"
        echo ""
        echo "🎯 O sistema agora deve ter todas as bases necessárias!"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        echo -e "${YELLOW}${BOLD}"
        echo ""
        echo "=========================================================================="
        echo "⚡ CORREÇÕES APLICADAS MAS AINDA HÁ PENDÊNCIAS"
        echo "=========================================================================="
        echo ""
        echo "🔧 Aplicadas: $FIXES_APPLIED de $TOTAL_FIXES correções"
        echo "⚠️  Algumas tabelas podem ainda estar faltando"
        echo ""
        echo "🚀 PRÓXIMOS PASSOS:"
        echo "   1. Verificar logs acima para erros específicos"
        echo "   2. ./scripts/test-complete-system-phases.sh  # Teste novamente"
        echo "   3. Aplicar correções adicionais se necessário"
        echo "=========================================================================="
        echo -e "${NC}"
    fi
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi