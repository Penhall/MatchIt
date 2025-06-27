#!/bin/bash

# scripts/test-phase0.sh - Teste de integração da Fase 0 usando curl

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuração
API_BASE_URL="http://localhost:3000/api"
TEST_EMAIL="test_fase0_$(date +%s)@example.com"
TEST_PASSWORD="123456"
TEST_NAME="Usuario Teste Fase 0"
TOKEN=""
USER_ID=""

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para printar com cores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}${1}${NC}"
}

print_test() {
    echo -e "${BLUE}🔍 $1${NC}"
}

# Função para executar teste
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "Executando: $test_name"
    
    # Executar comando e capturar status
    response=$(eval "$test_command" 2>/dev/null)
    status=$?
    
    if [ $status -eq $expected_status ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "PASSOU: $test_name"
        echo "Response: $response" | head -n 3
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_error "FALHOU: $test_name (status: $status, esperado: $expected_status)"
        echo "Response: $response" | head -n 3
    fi
    echo ""
}

# Função para testar com JSON response
test_json_endpoint() {
    local test_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local auth_header="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "Executando: $test_name"
    
    # Construir comando curl
    curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ -n "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    curl_cmd="$curl_cmd $url"
    
    # Executar e separar response do status code
    response=$(eval "$curl_cmd")
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "PASSOU: $test_name (HTTP $http_code)"
        echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_error "FALHOU: $test_name (HTTP $http_code)"
        echo "$response_body"
    fi
    echo ""
}

# Verificar se servidor está rodando
check_server() {
    print_info "Verificando se servidor está rodando..."
    
    if curl -f -s "$API_BASE_URL/health" > /dev/null; then
        print_status "Servidor está rodando na porta 3001"
        return 0
    else
        print_error "Servidor não está rodando ou não responde em $API_BASE_URL"
        print_info "Certifique-se de que o servidor está rodando: npm run server"
        exit 1
    fi
}

# Registrar usuário de teste
register_user() {
    print_info "Registrando usuário de teste..."
    
    response=$(curl -s -w '%{http_code}' -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
        "$API_BASE_URL/auth/register")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    print_info "Response body: $response_body"
    print_info "HTTP Code: $http_code"
    
    if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
        print_status "Usuário registrado com sucesso"
        
        # Extrair token e user ID usando jq se disponível, senão sed
        if command -v jq &> /dev/null; then
            TOKEN=$(echo "$response_body" | jq -r '.token')
            USER_ID=$(echo "$response_body" | jq -r '.user.id')
        else
            TOKEN=$(echo "$response_body" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
            USER_ID=$(echo "$response_body" | sed -n 's/.*"id":"\?\([^,"]*\)"\?.*/\1/p')
        fi
        
        if [ -n "$TOKEN" ]; then
            print_status "Token obtido: ${TOKEN:0:30}..."
            print_status "User ID: $USER_ID"
        else
            print_warning "Token não encontrado na response, tentando login..."
            login_user
        fi
    else
        print_warning "Registro falhou (HTTP $http_code), tentando login..."
        print_warning "Response: $response_body"
        login_user
    fi
}

# Login do usuário
login_user() {
    print_info "Fazendo login do usuário..."
    
    response=$(curl -s -w '%{http_code}' -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$API_BASE_URL/auth/login")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    print_info "Login response body: $response_body"
    print_info "Login HTTP Code: $http_code"
    
    if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
        print_status "Login realizado com sucesso"
        
        # Extrair token e user ID usando jq se disponível, senão sed
        if command -v jq &> /dev/null; then
            TOKEN=$(echo "$response_body" | jq -r '.token')
            USER_ID=$(echo "$response_body" | jq -r '.user.id')
        else
            TOKEN=$(echo "$response_body" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
            USER_ID=$(echo "$response_body" | sed -n 's/.*"id":"\?\([^,"]*\)"\?.*/\1/p')
        fi
        
        if [ -n "$TOKEN" ]; then
            print_status "Token obtido: ${TOKEN:0:30}..."
            print_status "User ID: $USER_ID"
        else
            print_error "Falha ao obter token"
            print_error "Response completa: $response_body"
            exit 1
        fi
    else
        print_error "Falha no login: $response_body"
        exit 1
    fi
}

# Executar testes dos endpoints
run_endpoint_tests() {
    print_header "🔗 TESTANDO ENDPOINTS BACKEND"
    
    # Teste 1: GET style-preferences (vazio)
    test_json_endpoint \
        "GET style-preferences (inicial)" \
        "$API_BASE_URL/profile/style-preferences" \
        "GET" \
        "" \
        "$TOKEN"
    
    # Teste 2: PUT style-preferences (criar primeira)
    test_json_endpoint \
        "PUT style-preferences (criar)" \
        "$API_BASE_URL/profile/style-preferences" \
        "PUT" \
        '{"category":"cores","questionId":"color_1","selectedOption":"warm"}' \
        "$TOKEN"
    
    # Teste 3: GET style-preferences (com dados)
    test_json_endpoint \
        "GET style-preferences (com dados)" \
        "$API_BASE_URL/profile/style-preferences" \
        "GET" \
        "" \
        "$TOKEN"
    
    # Teste 4: PUT style-preferences (atualizar)
    test_json_endpoint \
        "PUT style-preferences (atualizar)" \
        "$API_BASE_URL/profile/style-preferences" \
        "PUT" \
        '{"category":"cores","questionId":"color_1","selectedOption":"cool"}' \
        "$TOKEN"
    
    # Teste 5: POST batch preferences
    test_json_endpoint \
        "POST style-preferences/batch" \
        "$API_BASE_URL/profile/style-preferences/batch" \
        "POST" \
        '{"preferences":[{"category":"tenis","questionId":"tenis_1","selectedOption":"casual"},{"category":"roupas","questionId":"roupas_1","selectedOption":"elegante"}]}' \
        "$TOKEN"
    
    # Teste 6: Verificação estado final
    test_json_endpoint \
        "Verificação estado final" \
        "$API_BASE_URL/profile/style-preferences" \
        "GET" \
        "" \
        "$TOKEN"
}

# Testar error handling
test_error_handling() {
    print_header "⚠️  TESTANDO ERROR HANDLING"
    
    # Teste sem auth
    test_json_endpoint \
        "Request sem auth token" \
        "$API_BASE_URL/profile/style-preferences" \
        "GET" \
        "" \
        ""
    
    # Teste dados inválidos
    test_json_endpoint \
        "Dados inválidos" \
        "$API_BASE_URL/profile/style-preferences" \
        "PUT" \
        '{"category":"","questionId":"test","selectedOption":"value"}' \
        "$TOKEN"
}

# Testar performance
test_performance() {
    print_header "⚡ TESTANDO PERFORMANCE"
    
    start_time=$(date +%s%N)
    
    curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/profile/style-preferences" > /dev/null
    
    end_time=$(date +%s%N)
    duration=$((($end_time - $start_time) / 1000000)) # Convert to milliseconds
    
    if [ $duration -lt 500 ]; then
        print_status "Performance GET: ${duration}ms (< 500ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Performance GET: ${duration}ms (> 500ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Cleanup
cleanup() {
    if [ -n "$TOKEN" ]; then
        print_info "Limpando dados de teste..."
        curl -s -X DELETE \
            -H "Authorization: Bearer $TOKEN" \
            "$API_BASE_URL/profile/style-preferences" > /dev/null
        print_status "Dados de teste removidos"
    fi
}

# Gerar relatório
generate_report() {
    print_header "📊 RELATÓRIO FINAL - FASE 0"
    
    # Calcular taxa de sucesso sem bc
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    else
        success_rate=0
    fi
    
    echo ""
    print_info "Estatísticas:"
    echo "  Total de testes: $TOTAL_TESTS"
    echo "  Testes aprovados: $PASSED_TESTS"
    echo "  Testes falharam: $FAILED_TESTS"
    echo "  Taxa de sucesso: $success_rate%"
    
    echo ""
    if [ $PASSED_TESTS -eq $TOTAL_TESTS ] && [ $TOTAL_TESTS -gt 0 ]; then
        print_header "🎉 FASE 0 COMPLETAMENTE IMPLEMENTADA!"
        print_status "Endpoints backend funcionando"
        print_status "Integração backend-frontend estabelecida"
        print_status "Error handling implementado"
        print_status "Performance dentro dos targets"
        echo ""
        print_header "🚀 Pronto para Fase 1: Perfil Emocional"
    elif [ $success_rate -ge 80 ]; then
        print_header "🟡 FASE 0 MAJORITARIAMENTE FUNCIONAL"
        print_warning "Alguns problemas menores encontrados"
        print_info "Revisar falhas antes de prosseguir para Fase 1"
    else
        print_header "🔴 PROBLEMAS SIGNIFICATIVOS NA FASE 0"
        print_error "Implementação precisa ser corrigida"
        print_error "Revisar endpoints e integração"
    fi
    
    echo ""
}

# Função principal
main() {
    print_header "🚀 INICIANDO TESTES DA FASE 0 - INTEGRAÇÃO BACKEND-FRONTEND"
    echo ""
    
    # Setup
    check_server
    register_user
    
    # Testes
    run_endpoint_tests
    test_error_handling
    test_performance
    
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

# Executar função principal
main "$@"
