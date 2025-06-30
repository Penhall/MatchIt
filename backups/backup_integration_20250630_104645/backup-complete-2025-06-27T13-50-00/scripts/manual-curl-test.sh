# scripts/manual-curl-test.sh - Comandos cURL para teste manual dos endpoints

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== TESTE MANUAL COM CURL ===${NC}\n"

# 1. REGISTRAR USUÁRIO
echo -e "${YELLOW}1. Registrando usuário...${NC}"
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste_manual@example.com",
    "password": "123456",
    "name": "Teste Manual",
    "city": "São Paulo"
  }' \
  http://localhost:3001/api/auth/register)

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extrair o token da resposta (assumindo que vem em JSON)
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"auth_token":"[^"]*"' | cut -d'"' -f4)
fi

echo -e "${GREEN}Token extraído: ${TOKEN:0:50}...${NC}\n"

# 2. TESTAR GET INICIAL (deve retornar vazio)
echo -e "${YELLOW}2. GET inicial style-preferences...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/style-preferences
echo -e "\n"

# 3. TESTAR PUT (criar preferências)
echo -e "${YELLOW}3. PUT style-preferences (criar)...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "casual",
    "colors": ["azul", "branco"],
    "occasions": ["trabalho", "lazer"],
    "brands": ["nike", "adidas"]
  }' \
  http://localhost:3001/api/style-preferences
echo -e "\n"

# 4. TESTAR GET (com dados)
echo -e "${YELLOW}4. GET style-preferences (com dados)...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/style-preferences
echo -e "\n"

# 5. TESTAR PUT (atualizar)
echo -e "${YELLOW}5. PUT style-preferences (atualizar)...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "formal",
    "colors": ["preto", "cinza"],
    "occasions": ["trabalho", "eventos"],
    "brands": ["zara", "calvin klein"]
  }' \
  http://localhost:3001/api/style-preferences
echo -e "\n"

# 6. TESTAR POST BATCH
echo -e "${YELLOW}6. POST style-preferences/batch...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "style": "esportivo",
        "colors": ["verde", "preto"],
        "occasions": ["academia", "corrida"],
        "brands": ["nike", "under armour"]
      }
    ]
  }' \
  http://localhost:3001/api/style-preferences/batch
echo -e "\n"

# 7. TESTE SEM TOKEN (deve falhar)
echo -e "${YELLOW}7. Teste sem Authorization header (deve falhar com 401)...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X GET \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/style-preferences
echo -e "\n"

# 8. TESTE COM TOKEN INVÁLIDO (deve falhar)
echo -e "${YELLOW}8. Teste com token inválido (deve falhar com 401)...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X GET \
  -H "Authorization: Bearer token_invalido" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/style-preferences
echo -e "\n"

# 9. TESTE COM DADOS INVÁLIDOS
echo -e "${YELLOW}9. PUT com dados inválidos (deve falhar com 400)...${NC}"
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "",
    "colors": "string_invalida",
    "occasions": null
  }' \
  http://localhost:3001/api/style-preferences
echo -e "\n"

echo -e "${GREEN}=== TESTE MANUAL CONCLUÍDO ===${NC}"
echo -e "${YELLOW}Analise os códigos HTTP e respostas acima para identificar problemas${NC}"