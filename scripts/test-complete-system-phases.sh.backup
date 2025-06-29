# scripts/test-complete-system-phases.sh
#!/bin/bash
# Script completo para testar todas as fases do sistema MatchIt (0, 1, 2)

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

# Contadores globais
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Arrays para relatório final
declare -a PHASE_RESULTS=()
declare -a FAILED_ITEMS=()
declare -a WARNING_ITEMS=()

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}${BOLD}"
    echo "=========================================================================="
    echo "🧪 MatchIt - TESTE COMPLETO DO SISTEMA"
    echo "🎯 Verificação das Fases 0, 1 e 2"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_phase_header() {
    echo -e "${BLUE}${BOLD}"
    echo ""
    echo "📋 ===== FASE $1: $2 ====="
    echo -e "${NC}"
}

print_section() {
    echo -e "${CYAN}${BOLD}🔍 $1${NC}"
}

print_test() {
    echo -n "   🧪 $1... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FAILED_ITEMS+=("$2: $1")
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNING_TESTS=$((WARNING_TESTS + 1))
    WARNING_ITEMS+=("$2: $1")
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# =====================================================
# FUNÇÕES DE CONFIGURAÇÃO
# =====================================================

load_environment() {
    print_section "CONFIGURAÇÃO INICIAL"
    
    print_test "Carregando arquivo .env"
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
        
        print_success "Configurações carregadas"
        print_info "DB: $PGDATABASE, User: $PGUSER, Host: $PGHOST:$PGPORT"
    else
        print_failure "Arquivo .env não encontrado" "CONFIG"
        return 1
    fi
}

check_dependencies() {
    print_test "Verificando dependências do sistema"
    
    local missing=0
    
    if ! command -v psql &> /dev/null; then
        print_failure "PostgreSQL CLI não encontrado" "DEPS"
        missing=$((missing + 1))
    fi
    
    if ! command -v node &> /dev/null; then
        print_failure "Node.js não encontrado" "DEPS"
        missing=$((missing + 1))
    fi
    
    if ! command -v npm &> /dev/null; then
        print_failure "npm não encontrado" "DEPS"
        missing=$((missing + 1))
    fi
    
    if [ $missing -eq 0 ]; then
        print_success "Todas as dependências encontradas"
        
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        print_info "Node.js: $node_version, npm: $npm_version"
    else
        print_failure "$missing dependência(s) faltando" "DEPS"
        return 1
    fi
}

test_database_connection() {
    print_test "Testando conexão com banco de dados"
    
    if psql -c "SELECT version();" >/dev/null 2>&1; then
        print_success "Conexão estabelecida"
        
        local db_version=$(psql -t -c "SELECT version();" | head -1 | xargs)
        print_info "PostgreSQL: ${db_version:0:50}..."
    else
        print_failure "Falha na conexão com banco" "DB_CONNECTION"
        return 1
    fi
}

# =====================================================
# TESTE DA FASE 0: SISTEMA BÁSICO DE PREFERÊNCIAS
# =====================================================

test_phase_0() {
    print_phase_header "0" "SISTEMA BÁSICO DE PREFERÊNCIAS DE ESTILO"
    
    local phase_score=0
    local phase_total=5
    
    # Tabelas essenciais da Fase 0
    local tables=("users" "style_choices" "style_recommendations")
    
    print_section "Verificando Estrutura do Banco - Fase 0"
    
    for table in "${tables[@]}"; do
        print_test "Verificando tabela '$table'"
        
        if psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | grep -q 't'; then
            print_success "Tabela '$table' existe"
            phase_score=$((phase_score + 1))
        else
            print_failure "Tabela '$table' não encontrada" "PHASE_0"
        fi
    done
    
    # Testar dados básicos
    print_test "Verificando dados da Fase 0"
    local user_count=$(psql -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs || echo "0")
    if [ "$user_count" -gt 0 ]; then
        print_success "$user_count usuário(s) encontrado(s)"
        phase_score=$((phase_score + 1))
    else
        print_warning "Nenhum usuário encontrado" "PHASE_0"
    fi
    
    # Testar integridade referencial
    print_test "Verificando integridade referencial"
    if psql -c "SELECT sc.id FROM style_choices sc JOIN users u ON sc.user_id = u.id LIMIT 1;" >/dev/null 2>&1; then
        print_success "Relacionamentos funcionando"
        phase_score=$((phase_score + 1))
    else
        print_warning "Problemas de integridade ou dados vazios" "PHASE_0"
    fi
    
    PHASE_RESULTS+=("Fase 0: $phase_score/$phase_total pontos")
}

# =====================================================
# TESTE DA FASE 1: SISTEMA DE PERFIL EMOCIONAL
# =====================================================

test_phase_1() {
    print_phase_header "1" "SISTEMA DE PERFIL EMOCIONAL E APRENDIZADO"
    
    local phase_score=0
    local phase_total=7
    
    # Tabelas essenciais da Fase 1
    local tables=("emotional_states" "learning_sessions" "learning_session_emotions" "user_algorithm_weights" "user_learning_profiles")
    
    print_section "Verificando Estrutura do Banco - Fase 1"
    
    for table in "${tables[@]}"; do
        print_test "Verificando tabela '$table'"
        
        if psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | grep -q 't'; then
            print_success "Tabela '$table' existe"
            phase_score=$((phase_score + 1))
        else
            print_failure "Tabela '$table' não encontrada" "PHASE_1"
        fi
    done
    
    # Verificar funcionalidades específicas da Fase 1
    print_section "Testando Funcionalidades - Fase 1"
    
    print_test "Verificando sistema de pesos algorítmicos"
    if psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_algorithm_weights');" | grep -q 't'; then
        local weights_count=$(psql -t -c "SELECT COUNT(*) FROM user_algorithm_weights;" 2>/dev/null | xargs || echo "0")
        if [ "$weights_count" -gt 0 ]; then
            print_success "$weights_count configuração(ões) de peso encontrada(s)"
        else
            print_warning "Tabela de pesos existe mas está vazia" "PHASE_1"
        fi
        phase_score=$((phase_score + 1))
    else
        print_failure "Sistema de pesos não implementado" "PHASE_1"
    fi
    
    print_test "Verificando sistema de sessões de aprendizado"
    if psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learning_sessions');" | grep -q 't'; then
        print_success "Sistema de aprendizado disponível"
        phase_score=$((phase_score + 1))
    else
        print_failure "Sistema de aprendizado não implementado" "PHASE_1"
    fi
    
    PHASE_RESULTS+=("Fase 1: $phase_score/$phase_total pontos")
}

# =====================================================
# TESTE DA FASE 2: SISTEMA DE TORNEIOS
# =====================================================

test_phase_2() {
    print_phase_header "2" "SISTEMA COMPLETO DE TORNEIOS"
    
    local phase_score=0
    local phase_total=8
    
    # Tabelas essenciais da Fase 2
    local tables=("tournament_images" "tournament_sessions" "tournament_choices" "tournament_results")
    
    print_section "Verificando Estrutura do Banco - Fase 2"
    
    for table in "${tables[@]}"; do
        print_test "Verificando tabela '$table'"
        
        if psql -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | grep -q 't'; then
            print_success "Tabela '$table' existe"
            phase_score=$((phase_score + 1))
        else
            print_failure "Tabela '$table' não encontrada" "PHASE_2"
        fi
    done
    
    # Verificar ENUMs específicos da Fase 2
    print_section "Testando ENUMs e Tipos - Fase 2"
    
    print_test "Verificando enum de categorias de torneio"
    if psql -t -c "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tournament_category_enum');" | grep -q 't'; then
        print_success "Enum de categorias existe"
        phase_score=$((phase_score + 1))
    else
        print_failure "Enum de categorias não encontrado" "PHASE_2"
    fi
    
    print_test "Verificando enum de status de torneio"
    if psql -t -c "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tournament_status_enum');" | grep -q 't'; then
        print_success "Enum de status existe"
        phase_score=$((phase_score + 1))
    else
        print_failure "Enum de status não encontrado" "PHASE_2"
    fi
    
    # Verificar dados de torneios
    print_section "Testando Dados - Fase 2"
    
    print_test "Verificando imagens de torneio"
    local images_count=$(psql -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs || echo "0")
    if [ "$images_count" -gt 0 ]; then
        print_success "$images_count imagem(ns) de torneio encontrada(s)"
        phase_score=$((phase_score + 1))
    else
        print_warning "Nenhuma imagem de torneio encontrada" "PHASE_2"
    fi
    
    print_test "Verificando integridade do sistema de torneios"
    if psql -c "SELECT ts.id FROM tournament_sessions ts JOIN users u ON ts.user_id = u.id LIMIT 1;" >/dev/null 2>&1; then
        print_success "Relacionamentos de torneio funcionando"
        phase_score=$((phase_score + 1))
    else
        print_warning "Relacionamentos de torneio com problemas ou sem dados" "PHASE_2"
    fi
    
    PHASE_RESULTS+=("Fase 2: $phase_score/$phase_total pontos")
}

# =====================================================
# TESTES DE INTEGRAÇÃO E PERFORMANCE
# =====================================================

test_system_integration() {
    print_phase_header "INTEGRAÇÃO" "TESTES DE INTEGRAÇÃO DO SISTEMA"
    
    local integration_score=0
    local integration_total=5
    
    print_section "Testando Integração Entre Fases"
    
    print_test "Verificando relacionamento Users ↔ Preferências"
    if psql -c "SELECT u.id, sc.style_data FROM users u LEFT JOIN style_choices sc ON u.id = sc.user_id LIMIT 1;" >/dev/null 2>&1; then
        print_success "Integração Fase 0 ↔ Users funcionando"
        integration_score=$((integration_score + 1))
    else
        print_failure "Problemas na integração Fase 0" "INTEGRATION"
    fi
    
    print_test "Verificando relacionamento Users ↔ Perfil Emocional"
    if psql -c "SELECT u.id, uls.profile_data FROM users u LEFT JOIN user_learning_profiles uls ON u.id = uls.user_id LIMIT 1;" >/dev/null 2>&1; then
        print_success "Integração Fase 1 ↔ Users funcionando"
        integration_score=$((integration_score + 1))
    else
        print_warning "Problemas na integração Fase 1 ou dados vazios" "INTEGRATION"
    fi
    
    print_test "Verificando relacionamento Users ↔ Torneios"
    if psql -c "SELECT u.id, ts.tournament_type FROM users u LEFT JOIN tournament_sessions ts ON u.id = ts.user_id LIMIT 1;" >/dev/null 2>&1; then
        print_success "Integração Fase 2 ↔ Users funcionando"
        integration_score=$((integration_score + 1))
    else
        print_warning "Problemas na integração Fase 2 ou dados vazios" "INTEGRATION"
    fi
    
    print_section "Testando Performance"
    
    print_test "Verificando performance de consultas básicas"
    local start_time=$(date +%s%N)
    psql -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 100 ]; then
        print_success "Performance excelente (${duration}ms)"
        integration_score=$((integration_score + 1))
    elif [ $duration -lt 500 ]; then
        print_success "Performance boa (${duration}ms)"
        integration_score=$((integration_score + 1))
    else
        print_warning "Performance lenta (${duration}ms)" "PERFORMANCE"
    fi
    
    print_test "Verificando índices críticos"
    local indexes_count=$(psql -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | xargs || echo "0")
    if [ "$indexes_count" -gt 10 ]; then
        print_success "$indexes_count índices encontrados"
        integration_score=$((integration_score + 1))
    else
        print_warning "Poucos índices ($indexes_count) - performance pode ser impactada" "PERFORMANCE"
    fi
    
    PHASE_RESULTS+=("Integração: $integration_score/$integration_total pontos")
}

# =====================================================
# VERIFICAÇÃO DE ARQUIVOS E ESTRUTURA
# =====================================================

test_project_structure() {
    print_phase_header "ESTRUTURA" "VERIFICAÇÃO DE ARQUIVOS DO PROJETO"
    
    local structure_score=0
    local structure_total=10
    
    print_section "Verificando Arquivos Críticos"
    
    # Arquivos essenciais
    local critical_files=(
        "package.json"
        ".env"
        "server/app.js"
        "database/migrations"
        "scripts"
    )
    
    for file in "${critical_files[@]}"; do
        print_test "Verificando '$file'"
        if [ -e "$file" ]; then
            print_success "Encontrado"
            structure_score=$((structure_score + 1))
        else
            print_failure "Não encontrado" "STRUCTURE"
        fi
    done
    
    print_section "Verificando Scripts de Automação"
    
    local scripts=(
        "scripts/master-sync-phase2.sh"
        "scripts/test-db-connection.sh"
        "scripts/fix-phase2-db-credentials.sh"
    )
    
    for script in "${scripts[@]}"; do
        print_test "Verificando script '$script'"
        if [ -f "$script" ] && [ -x "$script" ]; then
            print_success "Encontrado e executável"
            structure_score=$((structure_score + 1))
        elif [ -f "$script" ]; then
            print_warning "Encontrado mas não executável" "STRUCTURE"
        else
            print_warning "Script não encontrado" "STRUCTURE"
        fi
    done
    
    print_section "Verificando Dependências Node.js"
    
    print_test "Verificando package.json"
    if [ -f "package.json" ]; then
        if node -p "JSON.parse(require('fs').readFileSync('package.json')).name" >/dev/null 2>&1; then
            print_success "package.json válido"
            structure_score=$((structure_score + 1))
        else
            print_failure "package.json inválido" "STRUCTURE"
        fi
    fi
    
    print_test "Verificando node_modules"
    if [ -d "node_modules" ]; then
        local deps_count=$(find node_modules -maxdepth 1 -type d | wc -l)
        print_success "$deps_count dependências instaladas"
        structure_score=$((structure_score + 1))
    else
        print_warning "node_modules não encontrado - execute 'npm install'" "STRUCTURE"
    fi
    
    PHASE_RESULTS+=("Estrutura: $structure_score/$structure_total pontos")
}

# =====================================================
# RELATÓRIO FINAL
# =====================================================

generate_final_report() {
    echo -e "${PURPLE}${BOLD}"
    echo ""
    echo "=========================================================================="
    echo "📊 RELATÓRIO FINAL - TESTE COMPLETO DAS FASES"
    echo "=========================================================================="
    echo -e "${NC}"
    
    # Estatísticas gerais
    echo -e "${CYAN}📈 ESTATÍSTICAS GERAIS:${NC}"
    echo -e "   Total de testes: ${BOLD}$TOTAL_TESTS${NC}"
    echo -e "   Sucessos: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "   Falhas: ${RED}$FAILED_TESTS${NC}"
    echo -e "   Avisos: ${YELLOW}$WARNING_TESTS${NC}"
    
    local success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "   Taxa de sucesso: ${BOLD}$success_rate%${NC}"
    echo ""
    
    # Resultados por fase
    echo -e "${CYAN}🎯 RESULTADOS POR FASE:${NC}"
    for result in "${PHASE_RESULTS[@]}"; do
        echo -e "   ${result}"
    done
    echo ""
    
    # Status geral do sistema
    echo -e "${CYAN}🚦 STATUS GERAL DO SISTEMA:${NC}"
    
    if [ $success_rate -ge 90 ]; then
        echo -e "${GREEN}${BOLD}🎉 EXCELENTE! Sistema praticamente completo e funcional.${NC}"
        echo -e "${GREEN}   ✅ Pronto para produção com pequenos ajustes${NC}"
    elif [ $success_rate -ge 75 ]; then
        echo -e "${YELLOW}${BOLD}👍 BOM! Sistema funcional com algumas pendências.${NC}"
        echo -e "${YELLOW}   ⚠️  Algumas funcionalidades precisam de atenção${NC}"
    elif [ $success_rate -ge 50 ]; then
        echo -e "${YELLOW}${BOLD}⚡ PARCIAL! Sistema básico funcionando.${NC}"
        echo -e "${YELLOW}   🔧 Várias implementações ainda necessárias${NC}"
    else
        echo -e "${RED}${BOLD}🚨 CRÍTICO! Sistema precisa de implementação significativa.${NC}"
        echo -e "${RED}   ❌ Muitas funcionalidades ainda não implementadas${NC}"
    fi
    echo ""
    
    # Itens que falharam
    if [ ${#FAILED_ITEMS[@]} -gt 0 ]; then
        echo -e "${RED}❌ FALHAS CRÍTICAS:${NC}"
        for item in "${FAILED_ITEMS[@]}"; do
            echo -e "${RED}   • $item${NC}"
        done
        echo ""
    fi
    
    # Avisos importantes
    if [ ${#WARNING_ITEMS[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  AVISOS IMPORTANTES:${NC}"
        for item in "${WARNING_ITEMS[@]}"; do
            echo -e "${YELLOW}   • $item${NC}"
        done
        echo ""
    fi
    
    # Próximos passos
    echo -e "${CYAN}🚀 PRÓXIMOS PASSOS RECOMENDADOS:${NC}"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "   1. ${RED}Corrigir falhas críticas listadas acima${NC}"
    fi
    
    if [ $success_rate -lt 75 ]; then
        echo -e "   2. ${BLUE}Executar sincronização: ./scripts/master-sync-phase2.sh${NC}"
    fi
    
    if [ $WARNING_TESTS -gt 0 ]; then
        echo -e "   3. ${YELLOW}Revisar avisos e implementar melhorias${NC}"
    fi
    
    echo -e "   4. ${GREEN}Executar testes novamente após correções${NC}"
    echo -e "   5. ${PURPLE}Iniciar desenvolvimento das funcionalidades pendentes${NC}"
    
    echo ""
    echo -e "${PURPLE}${BOLD}"
    echo "=========================================================================="
    echo "🏁 TESTE COMPLETO FINALIZADO"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    echo "Este script irá testar completamente todas as fases do sistema MatchIt:"
    echo ""
    echo "🔵 Fase 0: Sistema básico de preferências de estilo"
    echo "🟡 Fase 1: Sistema de perfil emocional e aprendizado"
    echo "🟢 Fase 2: Sistema completo de torneios"
    echo "⚪ Integração: Testes de integração e performance"
    echo "🟣 Estrutura: Verificação de arquivos e dependências"
    echo ""
    
    read -p "❓ Executar teste completo? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Teste cancelado."
        exit 0
    fi
    
    echo -e "${BLUE}🚀 Iniciando testes...${NC}"
    echo ""
    
    # Executar todos os testes
    load_environment || exit 1
    check_dependencies || exit 1
    test_database_connection || exit 1
    
    test_phase_0
    test_phase_1
    test_phase_2
    test_system_integration
    test_project_structure
    
    # Gerar relatório final
    generate_final_report
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi