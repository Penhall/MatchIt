#!/bin/bash
# scripts/test-final-simples.sh - Teste final simplificado sem erros de sintaxe

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000/api"
TEST_EMAIL="simple_test_$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Teste Final Simples"

echo -e "${BLUE}🧪 MATCHIT - TESTE FINAL SIMPLIFICADO${NC}"
echo ""

# Contadores
TOTAL=0
SUCCESS=0

# Função de teste simples
test_simple() {
    local desc="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local token="$5"
    
    echo -e "${YELLOW}🧪 $desc${NC}"
    TOTAL=$((TOTAL + 1))
    
    if [[ "$method" == "POST" ]]; then
        if [[ -n "$token" ]]; then
            status=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" "$url" 2>/dev/null)
        else
            status=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
                -H "Content-Type: application/json" \
                -d "$data" "$url" 2>/dev/null)
        fi
    elif [[ "$method" == "PUT" ]]; then
        status=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" "$url" 2>/dev/null)
    else
        if [[ -n "$token" ]]; then
            status=$(curl -s -w "%{http_code}" -o /dev/null -X GET \
                -H "Authorization: Bearer $token" "$url" 2>/dev/null)
        else
            status=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$url" 2>/dev/null)
        fi
    fi
    
    if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
        echo -e "   ${GREEN}✅ HTTP $status${NC}"
        SUCCESS=$((SUCCESS + 1))
        return 0
    else
        echo -e "   ${RED}❌ HTTP $status${NC}"
        return 1
    fi
}

echo -e "${BLUE}▶ INFRAESTRUTURA${NC}"
test_simple "Health Check" "$API_URL/health" "GET"
test_simple "Info API" "$API_URL/info" "GET"

echo -e "${BLUE}▶ AUTENTICAÇÃO${NC}"

# Registro
REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","name":"'$TEST_NAME'"}'

echo -e "${YELLOW}🧪 Registro${NC}"
TOTAL=$((TOTAL + 1))
REGISTER_RESP=$(curl -s -X POST -H "Content-Type: application/json" -d "$REGISTER_DATA" "$API_URL/auth/register" 2>/dev/null)
REGISTER_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST -H "Content-Type: application/json" -d "$REGISTER_DATA" "$API_URL/auth/register" 2>/dev/null)

if [[ "$REGISTER_STATUS" -ge 200 && "$REGISTER_STATUS" -lt 300 ]]; then
    echo -e "   ${GREEN}✅ HTTP $REGISTER_STATUS${NC}"
    SUCCESS=$((SUCCESS + 1))
    
    # Extrair token usando sed (mais compatível)
    TOKEN=$(echo "$REGISTER_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    
    if [[ -n "$TOKEN" ]]; then
        echo -e "   ${GREEN}✅ Token: ${TOKEN:0:20}...${NC}"
    fi
else
    echo -e "   ${RED}❌ HTTP $REGISTER_STATUS${NC}"
fi

# Login se não temos token
if [[ -z "$TOKEN" ]]; then
    LOGIN_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}'
    
    echo -e "${YELLOW}🧪 Login${NC}"
    TOTAL=$((TOTAL + 1))
    LOGIN_RESP=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$API_URL/auth/login" 2>/dev/null)
    LOGIN_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$API_URL/auth/login" 2>/dev/null)
    
    if [[ "$LOGIN_STATUS" -ge 200 && "$LOGIN_STATUS" -lt 300 ]]; then
        echo -e "   ${GREEN}✅ HTTP $LOGIN_STATUS${NC}"
        SUCCESS=$((SUCCESS + 1))
        
        TOKEN=$(echo "$LOGIN_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
        
        if [[ -n "$TOKEN" ]]; then
            echo -e "   ${GREEN}✅ Token: ${TOKEN:0:20}...${NC}"
        fi
    else
        echo -e "   ${RED}❌ HTTP $LOGIN_STATUS${NC}"
    fi
fi

# Testar /me
if [[ -n "$TOKEN" ]]; then
    test_simple "Endpoint /me" "$API_URL/auth/me" "GET" "" "$TOKEN"
else
    echo -e "${RED}❌ Sem token para /me${NC}"
    TOTAL=$((TOTAL + 1))
fi

echo -e "${BLUE}▶ PERFIL${NC}"

if [[ -n "$TOKEN" ]]; then
    test_simple "Buscar perfil" "$API_URL/profile" "GET" "" "$TOKEN"
    test_simple "Buscar preferências" "$API_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    PREF_DATA='{"category":"cores","preferences":{"cor":"azul"}}'
    test_simple "Atualizar preferências" "$API_URL/profile/style-preferences" "PUT" "$PREF_DATA" "$TOKEN"
else
    echo -e "${RED}❌ Sem token para perfil${NC}"
    TOTAL=$((TOTAL + 3))
fi

echo -e "${BLUE}▶ TORNEIOS${NC}"

test_simple "Categorias" "$API_URL/tournament/categories" "GET"
test_simple "Imagens" "$API_URL/tournament/images" "GET"

if [[ -n "$TOKEN" ]]; then
    TOURNAMENT_DATA='{"category":"cores","tournamentSize":8}'
    test_simple "Iniciar torneio" "$API_URL/tournament/start" "POST" "$TOURNAMENT_DATA" "$TOKEN"
    
    CHOICE_DATA='{"sessionId":"test123","imageA":"img1","imageB":"img2","choice":"imageA"}'
    test_simple "Registrar escolha" "$API_URL/tournament/choice" "POST" "$CHOICE_DATA" "$TOKEN"
else
    echo -e "${RED}❌ Sem token para torneios${NC}"
    TOTAL=$((TOTAL + 2))
fi

# Relatório final
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 📊 RELATÓRIO FINAL${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

PERCENTAGE=$((SUCCESS * 100 / TOTAL))

echo -e "${YELLOW}📊 RESULTADOS:${NC}"
echo -e "   Testes: $SUCCESS/$TOTAL"
echo -e "   Taxa de sucesso: $PERCENTAGE%"
echo ""

if [[ $PERCENTAGE -ge 90 ]]; then
    echo -e "${GREEN}🎉 SISTEMA EXCELENTE!${NC}"
    echo -e "${GREEN}   MatchIt está funcionando perfeitamente!${NC}"
elif [[ $PERCENTAGE -ge 80 ]]; then
    echo -e "${GREEN}✅ SISTEMA MUITO BOM!${NC}"
    echo -e "${GREEN}   MatchIt está quase perfeito!${NC}"
elif [[ $PERCENTAGE -ge 70 ]]; then
    echo -e "${YELLOW}⚠️ SISTEMA BOM${NC}"
    echo -e "${YELLOW}   MatchIt funcional com pequenos ajustes${NC}"
else
    echo -e "${RED}❌ PRECISA MELHORAR${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"