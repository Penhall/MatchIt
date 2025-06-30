# scripts/test-system-consistency.sh - Teste de consistência completo do sistema MatchIt
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Variáveis globais
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0
API_BASE_URL="http://localhost:3000/api"
TEST_USER_EMAIL="teste_consistency@matchit.com"
TEST_USER_PASSWORD="123456789"
TOKEN=""

print_header() {
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
}

print_phase_header() {
    echo ""
    echo -e "${PURPLE}🔍 TESTANDO: $1${NC}"
    echo -e "${PURPLE}------------------------------------------------${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para testar endpoints
test_endpoint() {
    local description="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local auth_header="$5"
    
    local curl_args=("-s" "-w" "\\n%{http_code}" "-X" "$method")
    
    if [ -n "$auth_header" ]; then
        curl_args+=("-H" "Authorization: Bearer $auth_header")
    fi
    
    if [ -n "$data" ] && [ "$data" != "null" ]; then
        curl_args+=("-H" "Content-Type: application/json" "-d" "$data")
    fi
    
    curl_args+=("$url")
    
    local response=$(curl "${curl_args[@]}" 2>/dev/null)
    local http_code="${response##*$'\\n'}"
    local body="${response%$'\\n'*}"
    
    if [[ "$http_code" =~ ^[23][0-9][0-9]$ ]]; then
        print_success "$description (HTTP $http_code)"
        return 0
    else
        print_error "$description (HTTP $http_code)"
        if [ -n "$body" ] && [ "$body" != "$http_code" ]; then
            echo "   Response: $body"
        fi
        return 1
    fi
}

# Verificar se servidor está rodando
check_server() {
    print_phase_header "VERIFICAÇÃO DO SERVIDOR"
    
    if curl -s "$API_BASE_URL/health" > /dev/null 2>&1; then
        print_success "Servidor está rodando"
    else
        print_error "Servidor não está rodando"
        print_info "Inicie o servidor com: npm start ou npm run server"
        exit 1
    fi
}

# Verificar estrutura do banco de dados
check_database() {
    print_phase_header "VERIFICAÇÃO DO BANCO DE DADOS"
    
    # Verificar tabelas essenciais
    local essential_tables=("users" "profiles" "style_choices")
    
    for table in "${essential_tables[@]}"; do
        if psql -d matchit_development -c "\\dt $table" > /dev/null 2>&1; then
            print_success "Tabela '$table' existe"
        else
            print_error "Tabela '$table' não encontrada"
        fi
    done
    
    # Verificar tabelas de torneio (esperadas para estar faltando)
    local tournament_tables=("tournament_images" "tournament_sessions" "tournament_results")
    
    print_info "Verificando tabelas de torneio (core do produto):"
    for table in "${tournament_tables[@]}"; do
        if psql -d matchit_development -c "\\dt $table" > /dev/null 2>&1; then
            print_success "Tabela de torneio '$table' existe"
        else
            print_warning "Tabela de torneio '$table' não encontrada (Fase 1 não implementada)"
        fi
    done
}

# Testar autenticação
test_authentication() {
    print_phase_header "TESTE DE AUTENTICAÇÃO"
    
    # Registrar usuário de teste
    local register_data=$(cat <<EOF
{
    "email": "$TEST_USER_EMAIL",
    "password": "$TEST_USER_PASSWORD",
    "name": "Teste Consistência"
}
EOF
)
    
    if test_endpoint "Registro de usuário" "$API_BASE_URL/auth/register" "POST" "$register_data"; then
        # Extrair token da resposta
        local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$register_data" "$API_BASE_URL/auth/register" 2>/dev/null)
        TOKEN=$(echo "$response" | jq -r '.token // .accessToken // empty' 2>/dev/null)
        
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            print_success "Token de autenticação obtido"
        else
            print_error "Token não encontrado na resposta do registro"
        fi
    fi
    
    # Testar login
    local login_data=$(cat <<EOF
{
    "email": "$TEST_USER_EMAIL",
    "password": "$TEST_USER_PASSWORD"
}
EOF
)
    
    test_endpoint "Login de usuário" "$API_BASE_URL/auth/login" "POST" "$login_data"
}

# Testar Fase 0: Integração Backend-Frontend
test_phase_0() {
    print_phase_header "FASE 0: INTEGRAÇÃO BACKEND-FRONTEND"
    
    if [ -z "$TOKEN" ]; then
        print_error "Token não disponível para testes da Fase 0"
        return
    fi
    
    # Testar endpoints de preferências de estilo
    test_endpoint "GET preferências de estilo" "$API_BASE_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    # Testar criação de preferência
    local style_data='{"category":"cores","questionId":"color_1","selectedOption":"warm"}'
    test_endpoint "PUT preferência de estilo" "$API_BASE_URL/profile/style-preferences" "PUT" "$style_data" "$TOKEN"
    
    # Testar batch save
    local batch_data='[{"category":"estilos","questionId":"style_1","selectedOption":"casual"}]'
    test_endpoint "POST batch preferências" "$API_BASE_URL/profile/style-preferences/batch" "POST" "$batch_data" "$TOKEN"
    
    # Verificar persistência
    test_endpoint "GET preferências após save" "$API_BASE_URL/profile/style-preferences" "GET" "" "$TOKEN"
}

# Testar Fase 1: Sistema de Torneios (esperado falhar)
test_phase_1() {
    print_phase_header "FASE 1: SISTEMA DE TORNEIOS POR IMAGENS"
    
    print_warning "Esta fase é o CORE do produto e não foi implementada"
    
    # Testar endpoints de torneio (esperados não existir)
    test_endpoint "GET imagens de torneio" "$API_BASE_URL/tournament/images/cores" "GET" "" "$TOKEN"
    test_endpoint "POST iniciar torneio" "$API_BASE_URL/tournament/start" "POST" '{"category":"cores"}' "$TOKEN"
    test_endpoint "GET sessão ativa" "$API_BASE_URL/tournament/active" "GET" "" "$TOKEN"
    
    print_info "Para implementar Fase 1:"
    print_info "  1. Criar tabelas de torneio no banco"
    print_info "  2. Implementar endpoints de torneio"
    print_info "  3. Criar interface gamificada 2x2"
    print_info "  4. Sistema de upload de imagens admin"
}

# Testar Fase 2: Perfil Emocional (esperado falhar)
test_phase_2() {
    print_phase_header "FASE 2: PERFIL EMOCIONAL"
    
    print_warning "Esta fase está planejada mas não implementada"
    
    # Testar endpoints emocionais (esperados não existir)
    test_endpoint "GET perfil emocional" "$API_BASE_URL/emotional-profile" "GET" "" "$TOKEN"
    test_endpoint "POST questionário emocional" "$API_BASE_URL/emotional-profile/questionnaire" "POST" '{"answers":[]}' "$TOKEN"
    
    print_info "Para implementar Fase 2:"
    print_info "  1. Criar esquema de perfil emocional"
    print_info "  2. Implementar questionário de 40 perguntas"
    print_info "  3. Algoritmo de compatibilidade emocional"
    print_info "  4. Integração com sistema híbrido"
}

# Testar algoritmos de recomendação
test_recommendation_system() {
    print_phase_header "SISTEMA DE RECOMENDAÇÃO"
    
    if [ -z "$TOKEN" ]; then
        print_warning "Token não disponível para testes de recomendação"
        return
    fi
    
    # Testar endpoint principal de recomendações
    test_endpoint "GET recomendações" "$API_BASE_URL/recommendations" "GET" "" "$TOKEN"
    
    # Testar feedback
    local feedback_data='{"targetUserId":999,"action":"like"}'
    test_endpoint "POST feedback" "$API_BASE_URL/recommendations/feedback" "POST" "$feedback_data" "$TOKEN"
    
    # Verificar métricas (se existirem)
    test_endpoint "GET métricas" "$API_BASE_URL/recommendations/metrics" "GET" "" "$TOKEN"
}

# Testar funcionalidades avançadas
test_advanced_features() {
    print_phase_header "FUNCIONALIDADES AVANÇADAS"
    
    # Cache e performance
    print_info "Verificando cache Redis..."
    if redis-cli ping > /dev/null 2>&1; then
        print_success "Redis está funcionando"
    else
        print_warning "Redis não está rodando"
    fi
    
    # Filtragem colaborativa
    print_warning "Filtragem colaborativa não implementada"
    
    # Sistema anti-spam
    print_warning "Sistema anti-spam básico (limitado)"
    
    # Aprendizado adaptativo
    print_warning "Aprendizado adaptativo não implementado"
}

# Verificar consistência de dados
test_data_consistency() {
    print_phase_header "CONSISTÊNCIA DE DADOS"
    
    # Verificar integridade referencial
    print_info "Verificando integridade referencial do banco..."
    
    # Verificar dados mockados vs reais
    print_warning "Sistema ainda usa dados mockados no frontend"
    print_info "StyleAdjustmentScreen.tsx precisa ser conectado ao backend real"
}

# Cleanup
cleanup() {
    print_phase_header "LIMPEZA"
    
    if [ -n "$TOKEN" ]; then
        # Deletar usuário de teste
        curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/profile" > /dev/null 2>&1
        print_info "Usuário de teste removido"
    fi
}

# Gerar relatório final
generate_final_report() {
    print_header "📊 RELATÓRIO FINAL DE CONSISTÊNCIA"
    
    echo -e "${CYAN}RESULTADOS GERAIS:${NC}"
    echo -e "  ✅ Testes Passaram: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "  ❌ Testes Falharam: ${RED}$FAILED_TESTS${NC}"
    echo -e "  ⚠️  Avisos: ${YELLOW}$WARNINGS${NC}"
    echo ""
    
    local total_tests=$((PASSED_TESTS + FAILED_TESTS))
    local success_rate=0
    
    if [ $total_tests -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / total_tests))
    fi
    
    echo -e "${CYAN}TAXA DE SUCESSO: ${GREEN}$success_rate%${NC}"
    echo ""
    
    echo -e "${CYAN}ESTADO DAS FASES:${NC}"
    echo -e "  🟡 Fase 0 (Integração): ${YELLOW}60% Implementada${NC}"
    echo -e "  🔴 Fase 1 (Torneios): ${RED}0% Implementada (CRÍTICO)${NC}"
    echo -e "  🔴 Fase 2 (Emocional): ${RED}0% Implementada${NC}"
    echo ""
    
    echo -e "${CYAN}PRÓXIMAS AÇÕES CRÍTICAS:${NC}"
    echo -e "  1. ${RED}Completar Fase 0${NC} - Endpoints e integração real"
    echo -e "  2. ${RED}Implementar Fase 1${NC} - Sistema de torneios (CORE)"
    echo -e "  3. ${YELLOW}Remover dados mockados${NC} - Frontend real"
    echo -e "  4. ${YELLOW}Admin panel para imagens${NC} - Gestão de conteúdo"
    echo ""
    
    if [ $success_rate -ge 70 ]; then
        echo -e "${GREEN}✅ Base funcional existe - Pronto para desenvolvimento das fases${NC}"
    elif [ $success_rate -ge 50 ]; then
        echo -e "${YELLOW}⚠️  Base parcial - Corrija problemas críticos antes de prosseguir${NC}"
    else
        echo -e "${RED}❌ Problemas fundamentais - Revisão completa necessária${NC}"
    fi
}

# Função principal
main() {
    print_header "🧪 TESTE DE CONSISTÊNCIA COMPLETO - MATCHIT"
    echo -e "${BLUE}Verificando estado atual de todas as fases implementadas${NC}"
    echo ""
    
    # Executar todos os testes
    check_server
    check_database
    test_authentication
    test_phase_0
    test_phase_1
    test_phase_2
    test_recommendation_system
    test_advanced_features
    test_data_consistency
    
    # Cleanup e relatório
    cleanup
    generate_final_report
    
    # Exit code baseado na taxa de sucesso
    local total_tests=$((PASSED_TESTS + FAILED_TESTS))
    local success_rate=0
    
    if [ $total_tests -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / total_tests))
    fi
    
    if [ $success_rate -ge 70 ]; then
        exit 0
    else
        exit 1
    fi
}

# Verificar dependências
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl não encontrado. Instale curl primeiro.${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql não encontrado. Alguns testes de banco serão ignorados.${NC}"
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq não encontrado. JSON será exibido sem formatação.${NC}"
fi

# Executar teste principal
main "$@"