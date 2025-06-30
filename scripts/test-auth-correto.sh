#!/bin/bash
# scripts/test-auth-correto.sh - Teste com extração de token corrigida

API_URL="http://localhost:3000/api"
TEST_EMAIL="correct_test_$(date +%s)@test.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Teste Correto"

echo "🧪 TESTE DE AUTENTICAÇÃO - EXTRAÇÃO CORRIGIDA"
echo ""

# Função para extrair token corretamente
extract_token() {
    local response="$1"
    
    # Método mais robusto usando sed
    local token=$(echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    
    # Verificar se token tem 3 partes
    local parts=$(echo "$token" | tr '.' '\n' | wc -l)
    
    if [[ $parts -eq 3 ]]; then
        echo "$token"
    else
        # Tentar método alternativo com awk
        token=$(echo "$response" | awk -F'"token":"' '{print $2}' | awk -F'"' '{print $1}')
        parts=$(echo "$token" | tr '.' '\n' | wc -l)
        
        if [[ $parts -eq 3 ]]; then
            echo "$token"
        else
            echo ""
        fi
    fi
}

# Teste de registro
echo "1. Registrando usuário..."
REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","name":"'$TEST_NAME'"}'

REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

echo "   Resposta: $(echo "$REGISTER_RESPONSE" | head -c 100)..."

# Extrair token usando função corrigida
TOKEN=$(extract_token "$REGISTER_RESPONSE")

if [[ -n "$TOKEN" ]]; then
    echo "✅ Token extraído corretamente:"
    echo "   Length: ${#TOKEN}"
    echo "   Partes: $(echo "$TOKEN" | tr '.' '\n' | wc -l)"
    echo "   Início: ${TOKEN:0:30}..."
    echo "   Fim: ...${TOKEN: -30}"
else
    echo "❌ Falha na extração, tentando login..."
    
    LOGIN_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}'
    LOGIN_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        "$API_URL/auth/login")
    
    TOKEN=$(extract_token "$LOGIN_RESPONSE")
fi

# Teste do endpoint /me
if [[ -n "$TOKEN" ]]; then
    echo ""
    echo "2. Testando endpoint /me..."
    
    ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/auth/me")
    
    ME_BODY=$(echo "$ME_RESPONSE" | head -n -1)
    ME_STATUS=$(echo "$ME_RESPONSE" | tail -n 1)
    
    echo "   Status: $ME_STATUS"
    
    if [[ "$ME_STATUS" == "200" ]]; then
        echo "✅ SUCESSO! Endpoint /me funcionando"
        echo "   Response: $ME_BODY"
    else
        echo "❌ Falha no endpoint /me"
        echo "   Response: $ME_BODY"
    fi
else
    echo "❌ Não foi possível extrair token válido"
fi

echo ""
echo "🏁 TESTE FINALIZADO"
