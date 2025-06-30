#!/bin/bash

# =========================================================================
# TESTE DE AUTENTICAÇÃO - DEBUG
# =========================================================================
# Este script testa o fluxo de autenticação e imprime o token e user_id
# para depuração.
# =========================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações de teste
API_BASE_URL="http://localhost:3000/api"
TEST_EMAIL="debug.test.$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Debug User"
TOKEN=""
USER_ID=""

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}$(printf '─%.0s' {1..50})${NC}"
}

print_test() {
    echo -e "${BLUE}   🧪 $1${NC}"
}

print_success() {
    echo -e "${GREEN}   ✅ $1${NC}"
}

print_failure() {
    echo -e "${RED}   ❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Função para fazer requisições HTTP e retornar o corpo da resposta
make_http_request_debug() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    local description="$5"
    local expected_status="${6:-200}"
    
    print_test "$description"
    
    local curl_cmd="curl -s -w '\nHTTP_CODE:%{http_code}'"
    curl_cmd="$curl_cmd -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    curl_cmd="$curl_cmd --connect-timeout 10"
    curl_cmd="$curl_cmd --max-time 30"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    local response
    response=$(eval $curl_cmd "$API_BASE_URL$endpoint" 2>/dev/null)
    local exit_code=$?
    
    local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    local response_body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ $exit_code -ne 0 ]; then
        print_failure "$description - Conexão falhou"
        echo ""
        return 1
    fi
    
    if [[ "$http_code" =~ ^${expected_status}$ ]] || [[ "$http_code" =~ ^2[0-9]{2}$ && "$expected_status" == "200" ]]; then
        print_success "$description (HTTP $http_code)"
    else
        print_failure "$description - HTTP $http_code (esperado: $expected_status)"
    fi
    
    print_info "Response Body: $response_body"
    echo "$response_body" # Retorna o corpo da resposta
    return 0
}

# =========================================================================
# TESTES DE AUTENTICAÇÃO
# =========================================================================

test_authentication_debug() {
    print_section "TESTE DE AUTENTICAÇÃO - DEBUG"
    
    # 1. Registro de usuário
    local register_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}"
    local register_response_json
    register_response_json=$(make_http_request_debug "POST" "/auth/register" "$register_data" "" "Registro de usuário" "201")
    
    if [ $? -eq 0 ] && [ -n "$register_response_json" ]; then
        if command -v jq &> /dev/null; then
            export TOKEN=$(echo "$register_response_json" | jq -r '.token')
            export USER_ID=$(echo "$register_response_json" | jq -r '.user.id')
        else
            export TOKEN=$(echo "$register_response_json" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            export USER_ID=$(echo "$register_response_json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        fi
        print_info "TOKEN após registro: ${TOKEN:0:20}..."
        print_info "USER_ID após registro: $USER_ID"
    else
        print_failure "Falha no registro ou resposta vazia."
        print_info "Tentando login com usuário existente (test@matchit.com)"
        local login_data="{\"email\":\"test@matchit.com\",\"password\":\"123456\"}"
        local login_response_json
        login_response_json=$(make_http_request_debug "POST" "/auth/login" "$login_data" "" "Login com usuário existente")
        if [ $? -eq 0 ] && [ -n "$login_response_json" ]; then
            if command -v jq &> /dev/null; then
                export TOKEN=$(echo "$login_response_json" | jq -r '.token')
                export USER_ID=$(echo "$login_response_json" | jq -r '.user.id')
            else
                export TOKEN=$(echo "$login_response_json" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
                export USER_ID=$(echo "$login_response_json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
            fi
            print_info "TOKEN após login existente: ${TOKEN:0:20}..."
            print_info "USER_ID após login existente: $USER_ID"
        else
            print_failure "Falha no login com usuário existente."
        fi
    fi
    
    # 2. Testar endpoint /auth/me com o token obtido
    if [ -n "$TOKEN" ]; then
        make_http_request_debug "GET" "/auth/me" "" "$TOKEN" "Verificação de token (auth/me)" "200"
    else
        print_warning "TOKEN não disponível para testar /auth/me."
    fi
}

# =========================================================================
# FUNÇÃO PRINCIPAL
# =========================================================================

main() {
    print_header "🧪 MATCHIT - TESTE DE AUTENTICAÇÃO (DEBUG)"
    echo -e "${BLUE}🎯 Testando fluxo de autenticação e depurando token/user_id${NC}"
    echo -e "${BLUE}📅 $(date)${NC}"
    echo ""
    
    read -p "❓ Executar teste de depuração de autenticação? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Teste cancelado."
        exit 0
    fi
    
    echo -e "${BLUE}🚀 Iniciando testes de depuração...${NC}"
    
    test_authentication_debug
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🏁 TESTE DE AUTENTICAÇÃO (DEBUG) FINALIZADO - $(date)${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
