#!/bin/bash
# scripts/test-jwt-debug.sh - Teste específico para debug do JWT

API_URL="http://localhost:3000/api"
TEST_EMAIL="jwt_debug_$(date +%s)@test.com"
TEST_PASSWORD="Test123456"
TEST_NAME="JWT Debug Test"

echo "🔍 TESTE DEBUG JWT"
echo ""

# 1. Registrar usuário
echo "1. Registrando usuário..."
REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","name":"'$TEST_NAME'"}'

REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

echo "Resposta do registro:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# 2. Extrair token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ -n "$TOKEN" ]]; then
    echo "✅ Token extraído:"
    echo "   Token: $TOKEN"
    echo "   Length: ${#TOKEN}"
    echo "   Início: ${TOKEN:0:30}..."
    echo "   Fim: ...${TOKEN: -30}"
    echo ""
    
    # 3. Testar endpoint /me com debug
    echo "2. Testando /me com token..."
    echo "   Authorization header: 'Bearer $TOKEN'"
    echo ""
    
    ME_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/auth/me")
    
    echo "Resposta do /me:"
    echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
    
else
    echo "❌ Token não encontrado na resposta"
    
    # Tentar login
    echo ""
    echo "Tentando login..."
    LOGIN_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}'
    
    LOGIN_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        "$API_URL/auth/login")
    
    echo "Resposta do login:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [[ -n "$TOKEN" ]]; then
        echo ""
        echo "✅ Token do login:"
        echo "   Token: $TOKEN"
        echo ""
        
        ME_RESPONSE=$(curl -s -X GET \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL/auth/me")
        
        echo "Resposta do /me:"
        echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
    fi
fi
