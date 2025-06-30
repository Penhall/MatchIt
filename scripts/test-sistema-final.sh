#!/bin/bash
# scripts/test-sistema-final.sh - Teste final com extração de token corrigida

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000/api"
TEST_EMAIL="final_test_$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Teste Final Sistema"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 🧪 MATCHIT - TESTE FINAL DO SISTEMA CORRIGIDO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Função melhorada para testar endpoint
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
    
    echo -e "   Status: $status_code"
    
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        echo -e "   ${GREEN}✅ SUCESSO${NC}"
        return 0
    else
        echo -e "   ${RED}❌ FALHA${NC}"
        echo -e "   Response: $body"
        return 1
    fi
}

TOTAL_TESTS=0
PASSED_TESTS=0

test_and_count() {
    ((TOTAL_TESTS++))
    if test_endpoint "$@"; then
        ((PASSED_TESTS++))
    fi
}

echo -e "${BLUE}▶ INFRAESTRUTURA${NC}"
test_and_count "Health Check" "$API_URL/health" "GET"
test_and_count "Info API" "$API_URL/info" "GET"

echo -e "${BLUE}▶ AUTENTICAÇÃO${NC}"

# Registro com extração de token melhorada
REGISTER_DATA=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "name": "$TEST_NAME"
}
