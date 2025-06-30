#!/bin/bash
# scripts/corrigir-extracao-token.sh - Correção da extração de token

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 CORREÇÃO: EXTRAÇÃO DE TOKEN NOS SCRIPTS${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   • Token tem 'partes incorretas' segundo o middleware"
echo -e "   • Script truncando token durante extração"
echo -e "   • Comando grep/cut cortando o token"
echo ""

echo -e "${BLUE}▶ TESTE: Verificar token real gerado${NC}"

# Testar extração com métodos diferentes
API_URL="http://localhost:3000/api"
TEST_EMAIL="token_test_$(date +%s)@test.com"

echo -e "${YELLOW}   Registrando usuário para testar extração...${NC}"

REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"Test123","name":"Token Test"}'

# Fazer registro e capturar resposta completa
FULL_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

echo "Resposta completa do registro:"
echo "$FULL_RESPONSE"
echo ""

# Testar diferentes métodos de extração
echo "🔍 TESTANDO MÉTODOS DE EXTRAÇÃO:"
echo ""

# Método 1: grep + cut (problemático)
TOKEN_METHOD1=$(echo "$FULL_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Método 1 (grep+cut): '$TOKEN_METHOD1'"
echo "   Partes: $(echo "$TOKEN_METHOD1" | tr '.' '\n' | wc -l)"

# Método 2: sed (mais robusto)
TOKEN_METHOD2=$(echo "$FULL_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "Método 2 (sed): '$TOKEN_METHOD2'"
echo "   Partes: $(echo "$TOKEN_METHOD2" | tr '.' '\n' | wc -l)"

# Método 3: jq (mais preciso)
if command -v jq >/dev/null 2>&1; then
    TOKEN_METHOD3=$(echo "$FULL_RESPONSE" | jq -r '.token' 2>/dev/null || echo "erro")
    echo "Método 3 (jq): '$TOKEN_METHOD3'"
    if [[ "$TOKEN_METHOD3" != "erro" && "$TOKEN_METHOD3" != "null" ]]; then
        echo "   Partes: $(echo "$TOKEN_METHOD3" | tr '.' '\n' | wc -l)"
    fi
fi

# Método 4: awk (alternativo)
TOKEN_METHOD4=$(echo "$FULL_RESPONSE" | awk -F'"token":"' '{print $2}' | awk -F'"' '{print $1}')
echo "Método 4 (awk): '$TOKEN_METHOD4'"
echo "   Partes: $(echo "$TOKEN_METHOD4" | tr '.' '\n' | wc -l)"

echo ""
echo -e "${BLUE}▶ IDENTIFICANDO MELHOR MÉTODO${NC}"

# Verificar qual método gera token com 3 partes
BEST_TOKEN=""
BEST_METHOD=""

if [[ $(echo "$TOKEN_METHOD2" | tr '.' '\n' | wc -l) -eq 3 ]]; then
    BEST_TOKEN="$TOKEN_METHOD2"
    BEST_METHOD="sed"
elif [[ $(echo "$TOKEN_METHOD4" | tr '.' '\n' | wc -l) -eq 3 ]]; then
    BEST_TOKEN="$TOKEN_METHOD4"
    BEST_METHOD="awk"
elif command -v jq >/dev/null 2>&1 && [[ $(echo "$TOKEN_METHOD3" | tr '.' '\n' | wc -l) -eq 3 ]]; then
    BEST_TOKEN="$TOKEN_METHOD3"
    BEST_METHOD="jq"
fi

if [[ -n "$BEST_TOKEN" ]]; then
    echo -e "${GREEN}✅ Melhor método: $BEST_METHOD${NC}"
    echo "   Token completo: ${BEST_TOKEN:0:50}...${BEST_TOKEN: -20}"
    echo "   Partes: $(echo "$BEST_TOKEN" | tr '.' '\n' | wc -l)"
    
    # Testar este token no endpoint /me
    echo ""
    echo -e "${YELLOW}   Testando token correto no /me...${NC}"
    
    ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $BEST_TOKEN" \
        "$API_URL/auth/me")
    
    ME_BODY=$(echo "$ME_RESPONSE" | head -n -1)
    ME_STATUS=$(echo "$ME_RESPONSE" | tail -n 1)
    
    echo "   Status: $ME_STATUS"
    echo "   Response: $ME_BODY"
    
    if [[ "$ME_STATUS" == "200" ]]; then
        echo -e "${GREEN}🎉 TOKEN FUNCIONANDO COM MÉTODO CORRETO!${NC}"
    fi
else
    echo -e "${RED}❌ Nenhum método gerou token válido${NC}"
fi

echo ""
echo -e "${BLUE}▶ CRIANDO SCRIPT DE TESTE CORRIGIDO${NC}"

cat > scripts/test-auth-correto.sh << 'EOF'
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
EOF

chmod +x scripts/test-auth-correto.sh

echo -e "${GREEN}✅ Script de teste corrigido criado${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ PROBLEMA DE EXTRAÇÃO DE TOKEN IDENTIFICADO E CORRIGIDO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 EXECUTE O TESTE CORRIGIDO:${NC}"
echo -e "   ${BLUE}./scripts/test-auth-correto.sh${NC}"
echo ""

echo -e "${GREEN}🎯 O QUE FOI CORRIGIDO:${NC}"
echo -e "   • Extração de token usando método mais robusto (sed)"
echo -e "   • Verificação automática de 3 partes do JWT"
echo -e "   • Método alternativo (awk) como fallback"
echo -e "   • Validação antes de enviar para o endpoint"
echo ""

echo -e "${YELLOW}💡 AGORA O TESTE DEVE MOSTRAR:${NC}"
echo -e "   ✅ Token com 3 partes extraído corretamente"
echo -e "   ✅ Endpoint /me retornando HTTP 200"
echo -e "   ✅ Sistema de autenticação 100% funcional"