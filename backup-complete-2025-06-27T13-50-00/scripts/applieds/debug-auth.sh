#!/bin/bash

# scripts/debug-auth.sh - Diagnóstico detalhado de autenticação

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Configuração
API_BASE_URL="http://localhost:3001/api"
TEST_EMAIL="debug_auth_$(date +%s)@example.com"
TEST_PASSWORD="123456"
TEST_NAME="Debug Auth User"

# Verificar se servidor está rodando
check_server() {
    print_header "🔍 VERIFICANDO SERVIDOR"
    
    if curl -f -s "$API_BASE_URL/health" > /dev/null; then
        print_status "Servidor está rodando"
        
        # Testar endpoints básicos
        print_info "Testando endpoints básicos..."
        
        health_resp=$(curl -s "$API_BASE_URL/health")
        print_info "Health: $health_resp"
        
        info_resp=$(curl -s "$API_BASE_URL/info")
        print_info "Info: $info_resp"
        
    else
        print_error "Servidor não está rodando"
        exit 1
    fi
}

# Testar registro detalhado
test_register() {
    print_header "📝 TESTANDO REGISTRO DETALHADO"
    
    print_info "Tentando registrar usuário: $TEST_EMAIL"
    
    # Fazer request com headers detalhados
    # Capturar o corpo da resposta e o código HTTP separadamente
    response_full=$(curl -s -v -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
        "$API_BASE_URL/auth/register" 2>&1)
    
    echo "Response completa:"
    echo "$response_full"
    echo ""
    
    # Extrair código HTTP da última linha que contém "HTTP/"
    http_code=$(echo "$response_full" | grep -oP '^< HTTP/\S+ \K\d{3}' | tail -n 1)
    
    # Extrair corpo da resposta JSON
    # Remove todas as linhas que começam com '*' ou '<' (cabeçalhos e informações do curl)
    # e então remove linhas vazias no início e fim
    response_body=$(echo "$response_full" | sed -e '/^\*/d' -e '/^</d' | sed -e '1,/^$/d' -e '/^$/d')
    
    print_info "HTTP Code: $http_code"
    print_info "Response Body: $response_body"
    
    if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
        print_status "Registro bem-sucedido"
        
        # Tentar extrair token de várias formas
        print_info "Tentando extrair token..."
        
        token1=$(echo "$response_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        token2=$(echo "$response_body" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
        user_id1=$(echo "$response_body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        user_id2=$(echo "$response_body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        user_id3=$(echo "$response_body" | sed -n 's/.*"id":"\?\([^,"]*\)"\?.*/\1/p')
        
        print_info "Token método 1: $token1"
        print_info "Token método 2: $token2"
        print_info "User ID método 1: $user_id1"
        print_info "User ID método 2: $user_id2" 
        print_info "User ID método 3: $user_id3"
        
        # Escolher o melhor token
        TOKEN=""
        if [ -n "$token1" ]; then
            TOKEN="$token1"
        elif [ -n "$token2" ]; then
            TOKEN="$token2"
        fi
        
        USER_ID=""
        if [ -n "$user_id1" ]; then
            USER_ID="$user_id1"
        elif [ -n "$user_id2" ]; then
            USER_ID="$user_id2"
        elif [ -n "$user_id3" ]; then
            USER_ID="$user_id3"
        fi
        
        print_status "Token final: ${TOKEN:0:50}..."
        print_status "User ID final: $USER_ID"
        
        return 0
    else
        print_error "Falha no registro"
        return 1
    fi
}

# Testar autenticação com diferentes formatos
test_auth_formats() {
    print_header "🔐 TESTANDO FORMATOS DE AUTENTICAÇÃO"
    
    if [ -z "$TOKEN" ]; then
        print_error "Token não disponível"
        return 1
    fi
    
    print_info "Testando diferentes formatos de Authorization header..."
    
    # Formato 1: Bearer token
    print_info "Teste 1: Bearer $TOKEN"
    resp1=$(curl -s -w '%{http_code}' -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_BASE_URL/profile/style-preferences")
    
    http_code1="${resp1: -3}"
    response_body1="${resp1%???}"
    print_info "Resultado 1: HTTP $http_code1"
    print_info "Body 1: $response_body1"
    echo ""
    
    # Formato 2: JWT token
    print_info "Teste 2: JWT $TOKEN"
    resp2=$(curl -s -w '%{http_code}' -X GET \
        -H "Authorization: JWT $TOKEN" \
        "$API_BASE_URL/profile/style-preferences")
    
    http_code2="${resp2: -3}"
    response_body2="${resp2%???}"
    print_info "Resultado 2: HTTP $http_code2"
    print_info "Body 2: $response_body2"
    echo ""
    
    # Formato 3: Token direto
    print_info "Teste 3: $TOKEN"
    resp3=$(curl -s -w '%{http_code}' -X GET \
        -H "Authorization: $TOKEN" \
        "$API_BASE_URL/profile/style-preferences")
    
    http_code3="${resp3: -3}"
    response_body3="${resp3%???}"
    print_info "Resultado 3: HTTP $http_code3"
    print_info "Body 3: $response_body3"
    echo ""
    
    # Formato 4: x-access-token header
    print_info "Teste 4: x-access-token"
    resp4=$(curl -s -w '%{http_code}' -X GET \
        -H "x-access-token: $TOKEN" \
        "$API_BASE_URL/profile/style-preferences")
    
    http_code4="${resp4: -3}"
    response_body4="${resp4%???}"
    print_info "Resultado 4: HTTP $http_code4"
    print_info "Body 4: $response_body4"
    echo ""
}

# Verificar estrutura do token JWT
analyze_token() {
    print_header "🔍 ANALISANDO TOKEN JWT"
    
    if [ -z "$TOKEN" ]; then
        print_error "Token não disponível"
        return 1
    fi
    
    print_info "Token: $TOKEN"
    print_info "Tamanho: ${#TOKEN} caracteres"
    
    # Verificar se é um JWT válido (3 partes separadas por .)
    part_count=$(echo "$TOKEN" | tr -cd '.' | wc -c)
    print_info "Número de pontos no token: $part_count"
    
    if [ "$part_count" -eq 2 ]; then
        print_status "Token tem formato JWT válido (3 partes)"
        
        # Extrair header
        header=$(echo "$TOKEN" | cut -d'.' -f1)
        print_info "Header (encoded): $header"
        
        # Tentar decodificar header (se base64 estiver disponível)
        if command -v base64 &> /dev/null; then
            # Adicionar padding se necessário
            padded_header=$(printf "%s====" "$header" | fold -w 4 | head -n 1)
            decoded_header=$(echo "$padded_header" | base64 -d 2>/dev/null || echo "Falha na decodificação")
            print_info "Header (decoded): $decoded_header"
        fi
        
    else
        print_warning "Token não parece ser um JWT válido"
    fi
}

# Testar outros endpoints
test_other_endpoints() {
    print_header "🔗 TESTANDO OUTROS ENDPOINTS"
    
    if [ -z "$TOKEN" ]; then
        print_error "Token não disponível"
        return 1
    fi
    
    # Testar profile básico
    print_info "Testando GET /api/profile"
    profile_resp=$(curl -s -w '%{http_code}' -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_BASE_URL/profile")
    
    http_code="${profile_resp: -3}"
    response_body="${profile_resp%???}"
    print_info "Profile: HTTP $http_code"
    print_info "Profile Body: $response_body"
    echo ""
    
    # Testar matches
    print_info "Testando GET /api/matches"
    matches_resp=$(curl -s -w '%{http_code}' -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_BASE_URL/matches")
    
    http_code="${matches_resp: -3}"
    response_body="${matches_resp%???}"
    print_info "Matches: HTTP $http_code"
    print_info "Matches Body: $response_body"
}

# Função principal
main() {
    print_header "🔍 DIAGNÓSTICO AVANÇADO DE AUTENTICAÇÃO"
    echo ""
    
    check_server
    echo ""
    
    if test_register; then
        echo ""
        analyze_token
        echo ""
        test_auth_formats
        echo ""
        test_other_endpoints
    else
        print_error "Não foi possível prosseguir sem registro bem-sucedido"
    fi
    
    echo ""
    print_header "📋 RESUMO DO DIAGNÓSTICO"
    
    if [ -n "$TOKEN" ]; then
        print_status "Token obtido com sucesso"
        print_info "Verifique acima qual formato de Authorization funcionou"
    else
        print_error "Falha ao obter token - problema no registro/login"
    fi
}

# Executar
main "$@"
