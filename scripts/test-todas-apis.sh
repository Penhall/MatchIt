#!/bin/bash
# scripts/test-todas-apis.sh - Teste rápido de todas as APIs após correção

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3000/api"
TEST_EMAIL="test_final_$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Teste Final APIs"

echo -e "${BLUE}🧪 TESTE RÁPIDO DE TODAS AS APIs${NC}"
echo ""

# Função para testar endpoint
test_endpoint() {
    local description="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local token="$5"
    
    echo -e "${YELLOW}🧪 $description${NC}"
    
    if [[ "$method" == "POST" ]]; then
        if [[ -n "$token" ]]; then
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                "$url" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$url" 2>/dev/null)
        fi
    elif [[ "$method" == "PUT" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "$url" 2>/dev/null)
    else
        if [[ -n "$token" ]]; then
            response=$(curl -s -w "\n%{http_code}" -X GET \
                -H "Authorization: Bearer $token" \
                "$url" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>/dev/null)
        fi
    fi
    
    # Separar body e status code
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        echo -e "   ${GREEN}✅ HTTP $status_code${NC}"
        return 0
    else
        echo -e "   ${RED}❌ HTTP $status_code${NC}"
        echo -e "   ${RED}   $body${NC}"
        return 1
    fi
}

echo -e "${BLUE}▶ ETAPA 1: Testar endpoints básicos${NC}"
test_endpoint "Health Check" "$API_URL/health" "GET"
test_endpoint "Info API" "$API_URL/info" "GET"

echo -e "${BLUE}▶ ETAPA 2: Testar autenticação${NC}"

# Registro
REGISTER_DATA=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "name": "$TEST_NAME"
}
EOF
)

if test_endpoint "Registro" "$API_URL/auth/register" "POST" "$REGISTER_DATA"; then
    # Extrair token
    REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$REGISTER_DATA" "$API_URL/auth/register")
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

# Login
LOGIN_DATA=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD"
}
EOF
)

if test_endpoint "Login" "$API_URL/auth/login" "POST" "$LOGIN_DATA"; then
    if [[ -z "$TOKEN" ]]; then
        LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$API_URL/auth/login")
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
fi

# Endpoint /me
if [[ -n "$TOKEN" ]]; then
    test_endpoint "Endpoint /me" "$API_URL/auth/me" "GET" "" "$TOKEN"
else
    echo -e "${RED}❌ Token não disponível para testar /me${NC}"
fi

echo -e "${BLUE}▶ ETAPA 3: Testar APIs de perfil${NC}"

if [[ -n "$TOKEN" ]]; then
    test_endpoint "Buscar perfil" "$API_URL/profile" "GET" "" "$TOKEN"
    test_endpoint "Buscar preferências" "$API_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    # Atualizar preferência
    PREF_DATA=$(cat <<EOF
{
    "category": "cores",
    "preferences": {"cor_favorita": "azul"}
}
EOF
)
    test_endpoint "Atualizar preferências" "$API_URL/profile/style-preferences" "PUT" "$PREF_DATA" "$TOKEN"
else
    echo -e "${RED}❌ Token não disponível para testar perfil${NC}"
fi

echo -e "${BLUE}▶ ETAPA 4: Testar APIs de torneio${NC}"

test_endpoint "Listar categorias" "$API_URL/tournament/categories" "GET"
test_endpoint "Listar imagens" "$API_URL/tournament/images" "GET"

if [[ -n "$TOKEN" ]]; then
    # Iniciar torneio
    TOURNAMENT_DATA=$(cat <<EOF
{
    "category": "cores",
    "tournamentSize": 8
}
EOF
)
    test_endpoint "Iniciar torneio" "$API_URL/tournament/start" "POST" "$TOURNAMENT_DATA" "$TOKEN"
    
    # Registrar escolha
    CHOICE_DATA=$(cat <<EOF
{
    "sessionId": "test_session_123",
    "imageA": "image1.jpg",
    "imageB": "image2.jpg",
    "choice": "imageA"
}
EOF
)
    test_endpoint "Registrar escolha" "$API_URL/tournament/choice" "POST" "$CHOICE_DATA" "$TOKEN"
else
    echo -e "${RED}❌ Token não disponível para testar torneios autenticados${NC}"
fi

echo ""
echo -e "${GREEN}🎉 TESTE RÁPIDO FINALIZADO!${NC}"
echo ""
echo -e "${YELLOW}Se todos os testes passaram, execute:${NC}"
echo -e "   ${BLUE}./scripts/test-sistema-completo-melhorado.sh${NC}"
echo ""