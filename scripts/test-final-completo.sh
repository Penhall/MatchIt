#!/bin/bash
# scripts/test-final-completo.sh - Teste final após correção

API_URL="http://localhost:3000/api"
TEST_EMAIL="final_validation_$(date +%s)@test.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Validação Final"

echo "🧪 TESTE FINAL DE VALIDAÇÃO COMPLETA"
echo ""

# Função de extração corrigida
extract_token() {
    local response="$1"
    echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

TOTAL_TESTS=0
PASSED_TESTS=0

test_endpoint() {
    local desc="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local token="$5"
    
    echo -n "🧪 $desc: "
    ((TOTAL_TESTS++))
    
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
    else
        if [[ -n "$token" ]]; then
            status=$(curl -s -w "%{http_code}" -o /dev/null -X GET \
                -H "Authorization: Bearer $token" \
                "$url" 2>/dev/null)
        else
            status=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$url" 2>/dev/null)
        fi
    fi
    
    if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
        echo "✅ HTTP $status"
        ((PASSED_TESTS++))
        return 0
    else
        echo "❌ HTTP $status"
        return 1
    fi
}

# 1. Testes básicos
test_endpoint "Health Check" "$API_URL/health" "GET"
test_endpoint "Info API" "$API_URL/info" "GET"

# 2. Autenticação
echo ""
echo "🔐 AUTENTICAÇÃO:"

REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","name":"'$TEST_NAME'"}'

echo -n "🧪 Registro: "
((TOTAL_TESTS++))
REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo "✅ HTTP 201"
    ((PASSED_TESTS++))
    TOKEN=$(extract_token "$REGISTER_RESPONSE")
elif echo "$REGISTER_RESPONSE" | grep -q "já existe"; then
    echo "⚠️ Usuário existe, fazendo login..."
    LOGIN_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}'
    LOGIN_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        "$API_URL/auth/login")
    TOKEN=$(extract_token "$LOGIN_RESPONSE")
    if [[ -n "$TOKEN" ]]; then
        echo "✅ Login OK"
        ((PASSED_TESTS++))
    fi
else
    echo "❌ Falha"
fi

# 3. Endpoint /me (PRINCIPAL)
if [[ -n "$TOKEN" ]]; then
    test_endpoint "Endpoint /me" "$API_URL/auth/me" "GET" "" "$TOKEN"
    
    # 4. APIs de perfil
    echo ""
    echo "👤 PERFIL:"
    test_endpoint "Buscar perfil" "$API_URL/profile" "GET" "" "$TOKEN"
    test_endpoint "Buscar preferências" "$API_URL/profile/style-preferences" "GET" "" "$TOKEN"
else
    echo "❌ Sem token para testes autenticados"
    TOTAL_TESTS=$((TOTAL_TESTS + 3))
fi

# 5. APIs públicas
echo ""
echo "🏆 TORNEIOS:"
test_endpoint "Categorias" "$API_URL/tournament/categories" "GET"
test_endpoint "Imagens" "$API_URL/tournament/images" "GET"

# 6. Relatório final
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " 📊 RELATÓRIO FINAL DE VALIDAÇÃO"
echo "════════════════════════════════════════════════════════════════════"

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "📊 RESULTADOS:"
echo "   Sucessos: $PASSED_TESTS/$TOTAL_TESTS"
echo "   Taxa de sucesso: $PERCENTAGE%"
echo ""

if [[ $PERCENTAGE -ge 90 ]]; then
    echo "🎉 SISTEMA EXCELENTE!"
    echo "   MatchIt está funcionando perfeitamente!"
elif [[ $PERCENTAGE -ge 80 ]]; then
    echo "✅ SISTEMA MUITO BOM!"
    echo "   MatchIt está quase perfeito!"
elif [[ $PERCENTAGE -ge 70 ]]; then
    echo "⚠️ SISTEMA BOM"
    echo "   MatchIt funcional com pequenos ajustes"
else
    echo "❌ PRECISA MELHORAR"
    echo "   Mais correções necessárias"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════"
