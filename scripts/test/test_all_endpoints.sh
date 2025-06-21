#!/bin/bash
# scripts/test/test_all_endpoints.sh - Testa todos os endpoints da API
# Arquivo: scripts/test/test_all_endpoints.sh

# =====================================================
# TESTE COMPLETO DE TODOS OS ENDPOINTS
# =====================================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
API_URL="${API_URL:-http://localhost:3001}"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0"
USER_ID="1820114c-348a-455d-8fa6-decaf1ef61fb"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   MATCHIT - TESTE COMPLETO DE ENDPOINTS${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -e "${YELLOW}Testando: ${description}${NC}"
    echo "Endpoint: $method $endpoint"
    
    local response_file="/tmp/test_response.json"
    local curl_cmd="curl -s -w \"%{http_code}\" -X $method"
    
    # Adicionar headers
    curl_cmd="$curl_cmd -H \"Authorization: Bearer $TOKEN\""
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
    
    # Adicionar dados se fornecidos
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    # Adicionar URL e arquivo de saída
    curl_cmd="$curl_cmd \"$API_URL$endpoint\" -o \"$response_file\""
    
    # Executar comando
    http_code=$(eval $curl_cmd 2>/dev/null)
    
    # Verificar resultado
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Sucesso (HTTP $http_code)${NC}"
        
        # Mostrar resposta se for JSON válido
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            if command -v jq &> /dev/null; then
                echo -e "${BLUE}Resposta:${NC}"
                cat "$response_file" | jq . 2>/dev/null || cat "$response_file"
            else
                echo -e "${BLUE}Resposta:${NC}"
                cat "$response_file"
            fi
        fi
        
    else
        echo -e "${RED}❌ Falha (HTTP $http_code, esperado $expected_status)${NC}"
        
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            echo -e "${RED}Resposta de erro:${NC}"
            cat "$response_file"
        fi
    fi
    
    echo ""
    rm -f "$response_file"
}

# Verificar se servidor está rodando
echo -e "${YELLOW}Verificando se servidor está rodando...${NC}"
if curl -s "$API_URL/" > /dev/null 2>&1 || curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor acessível${NC}"
else
    echo -e "${RED}❌ Servidor não acessível em $API_URL${NC}"
    exit 1
fi
echo ""

# Teste 1: Buscar perfil (já sabemos que funciona)
test_endpoint "GET" "/api/profile/$USER_ID" "Buscar perfil do usuário"

# Teste 2: Buscar preferências de estilo
test_endpoint "GET" "/api/profile/style-preferences" "Buscar preferências de estilo"

# Teste 3: Atualizar perfil
test_endpoint "PUT" "/api/profile" "Atualizar perfil do usuário" \
'{"displayName":"Usuário Teste Atualizado","city":"São Paulo","age":28,"bio":"Bio de teste atualizada"}'

# Teste 4: Verificar se a atualização funcionou
test_endpoint "GET" "/api/profile/$USER_ID" "Verificar perfil após atualização"

# Teste 5: Adicionar/atualizar preferência de estilo
test_endpoint "PUT" "/api/profile/style-preferences" "Atualizar preferência de estilo" \
'{"category":"Clothing","questionId":"clothing_style_1","selectedOption":"streetwear"}'

# Teste 6: Verificar preferências após atualização
test_endpoint "GET" "/api/profile/style-preferences" "Verificar preferências após atualização"

# Teste 7: Testar endpoint que pode não existir (para verificar 404)
test_endpoint "GET" "/api/profile/nonexistent" "Endpoint inexistente" "" 404

# Teste 8: Testar sem token (para verificar 401)
echo -e "${YELLOW}Testando: Acesso sem token${NC}"
echo "Endpoint: GET /api/profile/style-preferences"

response_without_token=$(curl -s -w "%{http_code}" \
    -H "Content-Type: application/json" \
    "$API_URL/api/profile/style-preferences" \
    -o /tmp/no_token_response.json 2>/dev/null)

if [ "$response_without_token" = "401" ]; then
    echo -e "${GREEN}✅ Proteção de autenticação funcionando (HTTP 401)${NC}"
else
    echo -e "${RED}❌ Proteção de autenticação falhou (HTTP $response_without_token)${NC}"
fi

if [ -f "/tmp/no_token_response.json" ]; then
    echo -e "${BLUE}Resposta sem token:${NC}"
    cat /tmp/no_token_response.json
    rm -f /tmp/no_token_response.json
fi
echo ""

# Teste 9: Testar com token inválido
echo -e "${YELLOW}Testando: Token inválido${NC}"
echo "Endpoint: GET /api/profile/style-preferences"

invalid_token_response=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer token_invalido_123" \
    -H "Content-Type: application/json" \
    "$API_URL/api/profile/style-preferences" \
    -o /tmp/invalid_token_response.json 2>/dev/null)

if [ "$invalid_token_response" = "401" ]; then
    echo -e "${GREEN}✅ Validação de token funcionando (HTTP 401)${NC}"
else
    echo -e "${RED}❌ Validação de token falhou (HTTP $invalid_token_response)${NC}"
fi

if [ -f "/tmp/invalid_token_response.json" ]; then
    echo -e "${BLUE}Resposta com token inválido:${NC}"
    cat /tmp/invalid_token_response.json
    rm -f /tmp/invalid_token_response.json
fi
echo ""

# Resumo final
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   RESUMO DOS TESTES${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo -e "${GREEN}Endpoints testados:${NC}"
echo "• GET /api/profile/{userId} - Buscar perfil"
echo "• GET /api/profile/style-preferences - Buscar preferências"
echo "• PUT /api/profile - Atualizar perfil"
echo "• PUT /api/profile/style-preferences - Atualizar preferências"
echo ""
echo -e "${GREEN}Segurança testada:${NC}"
echo "• Proteção contra acesso sem token"
echo "• Validação de token inválido"
echo "• Endpoints protegidos por autenticação"
echo ""
echo -e "${YELLOW}Para usar manualmente, substitua [SEU_TOKEN] pelo token real:${NC}"
echo ""
echo 'TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0"'
echo ""
echo 'curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/profile/style-preferences'
echo ""
echo -e "${BLUE}=====================================================${NC}"