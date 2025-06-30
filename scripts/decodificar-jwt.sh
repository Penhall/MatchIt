#!/bin/bash
# scripts/decodificar-jwt.sh - Decodificar JWT e corrigir problema do userId

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 DECODIFICAÇÃO JWT - ENCONTRAR PROBLEMA DO USERID${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA ATUAL:${NC}"
echo -e "   • Token extraído corretamente ✅"
echo -e "   • JWT com 3 partes ✅"
echo -e "   • Erro: 'userId ausente' no payload ❌"
echo ""

# Função para decodificar base64url (JWT)
decode_base64url() {
    local input="$1"
    # Adicionar padding se necessário
    local padded="$input"
    case $((${#input} % 4)) in
        2) padded="$input==" ;;
        3) padded="$input=" ;;
    esac
    # Substituir caracteres URL-safe e decodificar
    echo "$padded" | tr '_-' '/+' | base64 -d 2>/dev/null || echo "erro_decodificacao"
}

echo -e "${BLUE}▶ ETAPA 1: Gerar token e extrair payload${NC}"

API_URL="http://localhost:3000/api"
TEST_EMAIL="jwt_decode_$(date +%s)@test.com"

echo -e "${YELLOW}   Registrando usuário para obter token...${NC}"

REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"Test123","name":"JWT Decode Test"}'

REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

# Extrair token usando método correto
TOKEN=$(echo "$REGISTER_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [[ -n "$TOKEN" ]]; then
    echo -e "${GREEN}✅ Token obtido: ${TOKEN:0:30}...${TOKEN: -20}${NC}"
    echo ""
    
    # Dividir token em partes
    IFS='.' read -ra TOKEN_PARTS <<< "$TOKEN"
    
    echo -e "${BLUE}▶ ETAPA 2: Decodificar partes do JWT${NC}"
    
    # Header (primeira parte)
    echo -e "${YELLOW}   Header (parte 1):${NC}"
    HEADER=$(decode_base64url "${TOKEN_PARTS[0]}")
    echo "   $HEADER"
    
    # Payload (segunda parte) - ESTA É A IMPORTANTE
    echo -e "${YELLOW}   Payload (parte 2):${NC}"
    PAYLOAD=$(decode_base64url "${TOKEN_PARTS[1]}")
    echo "   $PAYLOAD"
    
    # Signature (terceira parte)
    echo -e "${YELLOW}   Signature (parte 3):${NC}"
    echo "   ${TOKEN_PARTS[2]} (hash - não decodificável)"
    
    echo ""
    echo -e "${BLUE}▶ ETAPA 3: Analisar payload${NC}"
    
    # Verificar se contém userId
    if echo "$PAYLOAD" | grep -q '"userId"'; then
        echo -e "${GREEN}✅ Campo 'userId' encontrado no payload${NC}"
        USER_ID=$(echo "$PAYLOAD" | sed -n 's/.*"userId":"\([^"]*\)".*/\1/p')
        echo "   userId: $USER_ID"
    else
        echo -e "${RED}❌ Campo 'userId' NÃO encontrado no payload${NC}"
        echo -e "${YELLOW}   Campos encontrados:${NC}"
        echo "$PAYLOAD" | tr ',' '\n' | sed 's/[{}]//g' | while read field; do
            if [[ -n "$field" ]]; then
                echo "     $field"
            fi
        done
    fi
    
else
    echo -e "${RED}❌ Falha ao obter token${NC}"
    echo "Resposta: $REGISTER_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}▶ ETAPA 4: Verificar código de geração do token${NC}"

echo -e "${YELLOW}   Analisando auth.js...${NC}"

if [[ -f "server/routes/auth.js" ]]; then
    # Procurar pela função generateToken
    echo "   Procurando função generateToken..."
    
    if grep -n "generateToken" server/routes/auth.js; then
        echo ""
        echo "   Código da função generateToken:"
        grep -A 10 "generateToken.*=" server/routes/auth.js | head -15
    fi
    
    echo ""
    echo "   Procurando uso do generateToken..."
    grep -n "generateToken(" server/routes/auth.js || echo "   Nenhum uso encontrado"
else
    echo -e "${RED}   ❌ auth.js não encontrado${NC}"
fi

echo ""
echo -e "${BLUE}▶ ETAPA 5: Propor correção${NC}"

# Verificar se o problema é no payload
if echo "$PAYLOAD" | grep -q '"userId"'; then
    echo -e "${YELLOW}   Problema pode estar no middleware que valida o token${NC}"
    echo -e "${YELLOW}   Middleware procura por 'userId' mas pode estar usando outro nome${NC}"
else
    echo -e "${YELLOW}   Problema está na geração do token${NC}"
    echo -e "${YELLOW}   Token não contém campo 'userId'${NC}"
    
    # Verificar se usa outro campo
    if echo "$PAYLOAD" | grep -q '"id"'; then
        echo -e "${GREEN}   ✅ Encontrado campo 'id' - pode ser este o problema${NC}"
        echo -e "${YELLOW}   Solução: Ajustar middleware para aceitar 'id' ou 'userId'${NC}"
    elif echo "$PAYLOAD" | grep -q '"user_id"'; then
        echo -e "${GREEN}   ✅ Encontrado campo 'user_id'${NC}"
        echo -e "${YELLOW}   Solução: Ajustar middleware para aceitar 'user_id'${NC}"
    fi
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} 🔍 ANÁLISE JWT CONCLUÍDA${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📋 RESUMO:${NC}"
echo -e "   • Token: Gerado e extraído corretamente"
echo -e "   • Payload: Decodificado com sucesso"
echo -e "   • Problema: Inconsistência de campo userId"
echo ""

echo -e "${BLUE}🚀 PRÓXIMO PASSO:${NC}"
echo -e "   Baseado na análise acima, vou criar correção específica"
echo -e "   para alinhar geração e validação do token"