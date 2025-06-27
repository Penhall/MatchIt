#!/bin/bash
# scripts/test-phase0-complete.sh - Teste completo da Fase 0

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 TESTANDO FASE 0 COMPLETA - MATCHIT${NC}"
echo "=============================================="
echo ""

API_BASE="http://localhost:3000/api"
TEST_USER_ID=1

# Função para fazer requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}🔍 Teste: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint" \
            -H "Authorization: Bearer test-token" \
            -H "Content-Type: application/json")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE$endpoint" \
            -H "Authorization: Bearer test-token" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE$endpoint" \
            -H "Authorization: Bearer test-token" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE$endpoint" \
            -H "Authorization: Bearer test-token" \
            -H "Content-Type: application/json")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ Sucesso ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Falhou ($http_code)${NC}"
        echo "$body"
    fi
    
    echo ""
    sleep 1
}

# Teste 1: Health check
make_request "GET" "/health" "" "Health check do sistema"

# Teste 2: Perfil básico
make_request "GET" "/profile" "" "Buscar perfil do usuário"

# Teste 3: Buscar preferências (inicialmente vazia)
make_request "GET" "/profile/style-preferences" "" "Buscar preferências de estilo"

# Teste 4: Salvar preferência de cores
color_preferences='{
    "category": "colors",
    "preferences": {
        "warm_colors": 0.8,
        "cool_colors": 0.2,
        "bright_colors": 0.7,
        "neutral_colors": 0.5
    },
    "confidence": 0.85
}'
make_request "PUT" "/profile/style-preferences" "$color_preferences" "Salvar preferências de cores"

# Teste 5: Salvar preferência de estilos
style_preferences='{
    "category": "styles",
    "preferences": {
        "casual": 0.9,
        "formal": 0.3,
        "sporty": 0.6,
        "vintage": 0.4
    },
    "confidence": 0.75
}'
make_request "PUT" "/profile/style-preferences" "$style_preferences" "Salvar preferências de estilos"

# Teste 6: Salvar escolha individual
choice_data='{
    "category": "colors",
    "questionId": "warm_vs_cool_1",
    "selectedOption": "warm_colors",
    "responseTime": 1500,
    "confidence": 4
}'
make_request "POST" "/profile/style-preferences/choice" "$choice_data" "Salvar escolha individual"

# Teste 7: Buscar preferências atualizadas
make_request "GET" "/profile/style-preferences" "" "Buscar preferências atualizadas"

# Teste 8: Buscar preferências por categoria
make_request "GET" "/profile/style-preferences?category=colors" "" "Buscar preferências de cores específica"

# Teste 9: Buscar escolhas de uma categoria
make_request "GET" "/profile/style-preferences/choices/colors" "" "Buscar escolhas da categoria cores"

# Teste 10: Perfil com estatísticas atualizadas
make_request "GET" "/profile" "" "Perfil com estatísticas atualizadas"

echo -e "${BLUE}🎉 TESTE DA FASE 0 CONCLUÍDO!${NC}"
echo ""
echo -e "${YELLOW}Para testar a limpeza de dados (opcional):${NC}"
echo "curl -X DELETE $API_BASE/profile/style-preferences \\"
echo "  -H \"Authorization: Bearer test-token\""
echo ""
