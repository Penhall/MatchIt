#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variáveis
API_BASE_URL="http://localhost:3000/api"
USER_ID="1820114c-348a-455d-8fa6-decaf1ef61fb"
TEST_EMAIL="finaltest@test.com"
TOKEN="$2a$12$5/gGQq2xODfB1lm.3JEBKegvbAYPMFSgDCqXKqKzP/gMVaUwEUVlu"
FAILED_TESTS=0
TOTAL_TESTS=0

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para testar endpoint
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local token="$5"
    
    ((TOTAL_TESTS++))
    print_info "Testando: $test_name"
    
    local curl_cmd="curl -s -w 'HTTP_CODE:%{http_code}' -X $method"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local response
    response=$(eval $curl_cmd)
    local http_code="${response##*HTTP_CODE:}"
    local response_body="${response%HTTP_CODE:*}"
    
    if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
        print_status "$test_name - HTTP $http_code"
        echo "   Response: $response_body" | head -c 200
        echo ""
        return 0
    else
        print_error "$test_name - HTTP $http_code"
        echo "   Error: $response_body"
        return 1
    fi
}

# Verificar se servidor está rodando
check_server() {
    print_header "🔍 VERIFICANDO SERVIDOR"
    
    if ! curl -s "$API_BASE_URL/health" > /dev/null; then
        print_error "Servidor não está rodando em $API_BASE_URL"
        print_info "Inicie o servidor com: npm run dev"
        exit 1
    fi
    
    print_status "Servidor está rodando"
}

# Testar endpoints de preferências de estilo
test_style_preferences() {
    print_header "🎨 TESTANDO ENDPOINTS DE PREFERÊNCIAS DE ESTILO"
    
    # 1. GET style-preferences (deve estar vazio inicialmente)
    test_endpoint "GET style-preferences (inicial)" "$API_BASE_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    # 2. PUT style-preferences (criar primeira preferência)
    local pref_data='{"category":"cores","questionId":"color_1","selectedOption":"warm"}'
    test_endpoint "PUT style-preferences (criar)" "$API_BASE_URL/profile/style-preferences" "PUT" "$pref_data" "$TOKEN"
    
    # 3. GET style-preferences (com dados)
    test_endpoint "GET style-preferences (com dados)" "$API_BASE_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    # 4. PATCH style-preferences (atualizar categoria específica)
    local update_data='{"questionId":"color_2","selectedOption":"cool"}'
    test_endpoint "PATCH style-preferences/cores" "$API_BASE_URL/profile/style-preferences/cores" "PATCH" "$update_data" "$TOKEN"
    
    # 5. DELETE style-preferences (limpar tudo)
    test_endpoint "DELETE style-preferences" "$API_BASE_URL/profile/style-preferences" "DELETE" "" "$TOKEN"
}

# Testar endpoints de perfil
test_profile_endpoints() {
    print_header "👤 TESTANDO ENDPOINTS DE PERFIL"
    
    # GET profile
    test_endpoint "GET profile" "$API_BASE_URL/profile" "GET" "" "$TOKEN"
    
    # Verificar se dados mockados foram removidos
    print_info "Verificando se dados mockados foram removidos..."
    local profile_response
    profile_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/profile")
    
    if echo "$profile_response" | grep -q "dados_mockados\|mock\|fake"; then
        print_error "Ainda há dados mockados no sistema"
    else
        print_status "Dados mockados removidos com sucesso"
    fi
}

# Testar handling de erros
test_error_handling() {
    print_header "🚨 TESTANDO TRATAMENTO DE ERROS"
    
    # Token inválido
    test_endpoint "Token inválido" "$API_BASE_URL/profile" "GET" "" "invalid_token"
    
    # Endpoint inexistente
    test_endpoint "Endpoint inexistente" "$API_BASE_URL/nonexistent" "GET" "" "$TOKEN"
    
    # Dados inválidos
    local invalid_data='{"invalid": "data"}'
    test_endpoint "Dados inválidos" "$API_BASE_URL/profile/style-preferences" "PUT" "$invalid_data" "$TOKEN"
}

# Cleanup
cleanup() {
    print_header "🧹 LIMPEZA"
    
    if [ -n "$TOKEN" ]; then
        # Tentar logout (se endpoint existir)
        curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/auth/logout" > /dev/null
        print_status "Logout realizado"
    fi
    
    print_status "Cleanup concluído"
}

# Relatório final
generate_report() {
    print_header "📊 RELATÓRIO FINAL - FASE 0"
    
    local success_rate=$(( (TOTAL_TESTS - FAILED_TESTS) * 100 / TOTAL_TESTS ))
    
    echo -e "Total de testes: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Testes passou: ${GREEN}$((TOTAL_TESTS - FAILED_TESTS))${NC}"
    echo -e "Testes falharam: ${RED}$FAILED_TESTS${NC}"
    echo -e "Taxa de sucesso: ${CYAN}$success_rate%${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_header "🎉 FASE 0 COMPLETA COM SUCESSO!"
        print_status "Backend integrado com frontend"
        print_status "Endpoints funcionando corretamente"
        print_status "Tratamento de erros implementado"
        print_status "Sistema sem dados mockados"
        echo ""
        print_header "🚀 PRONTO PARA FASE 1: SISTEMA DE TORNEIOS"
    elif [ $success_rate -ge 80 ]; then
        print_header "🟡 FASE 0 MAJORITARIAMENTE FUNCIONAL"
        print_warning "Alguns problemas menores encontrados"
        print_info "Revisar falhas antes de prosseguir para Fase 1"
    else
        print_header "🔴 PROBLEMAS SIGNIFICATIVOS NA FASE 0"
        print_error "Implementação precisa ser corrigida"
        print_error "Revisar endpoints e integração"
    fi
}

# Função principal
main() {
    print_header "🚀 INICIANDO TESTES DA FASE 0 - INTEGRAÇÃO BACKEND-FRONTEND"
    echo ""
    
    # Verificações e testes
    check_server
    test_style_preferences
    test_profile_endpoints
    test_error_handling
    
    # Cleanup e relatório
    cleanup
    generate_report
    
    # Exit code baseado nos resultados
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Verificar dependências
if ! command -v curl &> /dev/null; then
    print_error "curl não encontrado. Instale curl primeiro."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq não encontrado. JSON será exibido sem formatação."
fi

# Executar
main "$@"
