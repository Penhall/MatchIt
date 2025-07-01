#!/bin/bash
# test-auth-debug.sh - Script para debugar problemas de autenticação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 🔍 DEBUG DE AUTENTICAÇÃO - DIAGNÓSTICO COMPLETO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Função para testar endpoint com debug
test_endpoint_debug() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local auth_header=$5
    
    echo -e "${YELLOW}🔍 $description${NC}"
    echo -e "   ${BLUE}$method $endpoint${NC}"
    
    # Construir comando curl com verbose
    local curl_cmd="curl -v -s -w '\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}' -X $method"
    
    if [[ -n "$auth_header" ]]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
        echo -e "   🔑 Token: ${auth_header:0:20}..."
    else
        echo -e "   🚫 Sem token"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $BASE_URL$endpoint 2>&1"
    
    echo -e "   📡 Executando requisição..."
    local response=$(eval $curl_cmd)
    
    # Extrair informações da resposta
    local status_code=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
    local time_total=$(echo "$response" | grep 'TIME_TOTAL:' | cut -d: -f2)
    
    # Extrair headers da resposta verbose
    local auth_header_sent=$(echo "$response" | grep '> Authorization:' || echo "")
    local content_type_received=$(echo "$response" | grep '< content-type:' || echo "")
    
    echo -e "   📊 Resultado:"
    echo -e "      Status: $status_code"
    echo -e "      Tempo: ${time_total}s"
    
    if [[ -n "$auth_header_sent" ]]; then
        echo -e "      ✅ Header Authorization enviado"
    else
        echo -e "      ❌ Header Authorization NÃO enviado"
    fi
    
    # Extrair corpo da resposta (remover informações de debug)
    local body=$(echo "$response" | sed '/^>/d; /^</d; /^*/d; /^{.*}/d; /HTTP_STATUS:/d; /TIME_TOTAL:/d' | grep -E '^\{.*\}$' | head -1)
    
    if [[ "$status_code" == "200" || "$status_code" == "201" ]]; then
        echo -e "   ✅ ${GREEN}Sucesso${NC}"
        echo -e "   📄 Resposta: $(echo "$body" | jq -c . 2>/dev/null || echo "$body" | head -c 150)..."
    elif [[ "$status_code" == "401" ]]; then
        echo -e "   🔒 ${RED}401 - Não autorizado${NC}"
        echo -e "   📄 Erro: $(echo "$body" | jq -r '.error // .message' 2>/dev/null || echo "$body")"
    elif [[ "$status_code" == "403" ]]; then
        echo -e "   🚫 ${RED}403 - Acesso negado${NC}"
        echo -e "   📄 Erro: $(echo "$body" | jq -r '.error // .message' 2>/dev/null || echo "$body")"
    else
        echo -e "   ⚠️ ${YELLOW}Status inesperado: $status_code${NC}"
        echo -e "   📄 Resposta: $body"
    fi
    
    echo ""
    return 0
}

# Verificar se servidor está rodando
echo -e "${YELLOW}🏥 Verificando servidor...${NC}"
if ! curl -s "$BASE_URL/api/health" > /dev/null; then
    echo -e "${RED}❌ Servidor não está respondendo em $BASE_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor está rodando!${NC}"
echo ""

# Passo 1: Registrar usuário de teste
echo -e "${BLUE}📝 PASSO 1: Registrando usuário de teste...${NC}"
test_email="debug_$(date +%s)@test.com"
test_data="{\"email\":\"$test_email\",\"password\":\"123456\",\"name\":\"Debug User\"}"

test_endpoint_debug "POST" "/api/auth/register" "Registro de usuário" "$test_data" ""

# Passo 2: Fazer login e obter token
echo -e "${BLUE}🔐 PASSO 2: Fazendo login...${NC}"
login_data="{\"email\":\"$test_email\",\"password\":\"123456\"}"

login_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -d "$login_data" \
    "$BASE_URL/api/auth/login")

echo "📄 Resposta do login:"
echo "$login_response" | jq . 2>/dev/null || echo "$login_response"

# Extrair token
TOKEN=$(echo "$login_response" | jq -r '.token // .data.token // empty' 2>/dev/null)

if [[ -n "$TOKEN" && "$TOKEN" != "null" ]]; then
    echo -e "${GREEN}✅ Token obtido: ${TOKEN:0:30}...${NC}"
else
    echo -e "${RED}❌ Falha ao obter token do login${NC}"
    exit 1
fi
echo ""

# Passo 3: Testar endpoint /me
echo -e "${BLUE}👤 PASSO 3: Testando endpoint /me...${NC}"
test_endpoint_debug "GET" "/api/auth/me" "Verificar usuário logado" "" "$TOKEN"

# Passo 4: Testar endpoints que estavam com 403
echo -e "${BLUE}🎨 PASSO 4: Testando endpoints de estilo...${NC}"

test_endpoint_debug "GET" "/api/style/categories" "Categorias de estilo" "" "$TOKEN"
test_endpoint_debug "GET" "/api/style-preferences" "Preferências de estilo" "" "$TOKEN"
test_endpoint_debug "GET" "/api/style/completion-stats/1" "Estatísticas (ID fixo)" "" "$TOKEN"

# Passo 5: Testar com usuário ID do token
if [[ -n "$TOKEN" ]]; then
    echo -e "${BLUE}🔍 PASSO 5: Extraindo user ID do token...${NC}"
    
    # Decodificar JWT (parte do payload)
    payload=$(echo "$TOKEN" | cut -d. -f2)
    # Adicionar padding se necessário
    while [ $((${#payload} % 4)) -ne 0 ]; do
        payload="${payload}="
    done
    
    decoded=$(echo "$payload" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "{}")
    user_id=$(echo "$decoded" | jq -r '.userId // .id // "1"' 2>/dev/null)
    
    echo -e "   User ID do token: $user_id"
    
    test_endpoint_debug "GET" "/api/style/completion-stats/$user_id" "Estatísticas (user ID correto)" "" "$TOKEN"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 📊 RESUMO DO DEBUG${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🎯 Se algum teste falhou:${NC}"
echo -e "   1. Verifique os logs do servidor para mais detalhes"
echo -e "   2. Confirme se o middleware de autenticação foi atualizado"
echo -e "   3. Verifique se o banco de dados tem o usuário criado"
echo -e "   4. Confirme se a tabela 'users' tem o campo 'is_active'"
echo ""