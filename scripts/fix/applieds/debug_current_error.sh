#!/bin/bash
# scripts/fix/debug_current_error.sh - Debug específico do erro atual
# Arquivo: scripts/fix/debug_current_error.sh

# =====================================================
# DEBUG ESPECÍFICO DO ERRO ATUAL
# =====================================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-matchit}"
DB_PASSWORD="${DB_PASSWORD:-matchit123}"
DB_NAME="${DB_NAME:-matchit_db}"
API_URL="${API_URL:-http://localhost:3001}"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0"
USER_ID="1820114c-348a-455d-8fa6-decaf1ef61fb"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   MATCHIT - DEBUG DO ERRO ATUAL${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# 1. Testar a query exata que está falhando
echo -e "${YELLOW}1. Testando query exata do ProfileService atual...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Query exata do ProfileService atual (que pode estar falhando)
SELECT
  u.id AS user_id,
  u.email,
  u.name,
  u.email_verified,
  u.is_active,
  up.id AS profile_id,
  up.display_name,
  up.city,
  up.gender,
  up.avatar_url,
  up.bio,
  up.is_vip,
  up.age,
  up.style_completion_percentage,
  up.interests,
  up.location_latitude,
  up.location_longitude,
  up.style_game_level,
  up.style_game_xp,
  up.last_style_game_played_at,
  up.created_at AS profile_created_at,
  up.updated_at AS profile_updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = '1820114c-348a-455d-8fa6-decaf1ef61fb';
EOF

echo ""
echo -e "${YELLOW}2. Verificando exatamente quais colunas existem...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Mostrar exatamente quais colunas existem em user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
EOF

echo ""
echo -e "${YELLOW}3. Testando API com output detalhado...${NC}"

# Testar API com mais detalhes
response_file="/tmp/debug_response.json"
error_file="/tmp/debug_error.txt"

echo "Fazendo requisição para: $API_URL/api/profile/$USER_ID"
echo "Token: ${TOKEN:0:50}..."

curl_output=$(curl -v \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/api/profile/$USER_ID" \
    -o "$response_file" \
    -w "HTTP_CODE:%{http_code};TIME:%{time_total}" \
    2>"$error_file")

echo "Resultado do curl: $curl_output"

if [ -f "$response_file" ]; then
    echo ""
    echo -e "${BLUE}Resposta da API:${NC}"
    cat "$response_file"
    echo ""
fi

if [ -f "$error_file" ]; then
    echo ""
    echo -e "${BLUE}Headers e debug do curl:${NC}"
    cat "$error_file"
    echo ""
fi

# 4. Verificar logs do servidor se possível
echo -e "${YELLOW}4. Verificando logs do servidor...${NC}"

# Tentar diferentes formas de acessar logs
if [ -f "server.log" ]; then
    echo "=== Últimas 10 linhas do server.log ==="
    tail -10 server.log
elif [ -f "logs/server.log" ]; then
    echo "=== Últimas 10 linhas do logs/server.log ==="
    tail -10 logs/server.log
elif [ -f "backend.log" ]; then
    echo "=== Últimas 10 linhas do backend.log ==="
    tail -10 backend.log
elif docker ps | grep -q "backend\|matchit"; then
    echo "=== Últimas 10 linhas dos logs do Docker ==="
    container_id=$(docker ps | grep -E "backend|matchit" | head -1 | cut -d' ' -f1)
    if [ ! -z "$container_id" ]; then
        docker logs --tail=10 "$container_id"
    fi
else
    echo "Logs do servidor não encontrados"
    echo ""
    echo "Para ver logs em tempo real, execute em outro terminal:"
    echo "  tail -f server.log"
    echo "  # ou"
    echo "  docker logs -f <container_name>"
fi

# 5. Verificar se o processo está rodando
echo ""
echo -e "${YELLOW}5. Verificando processos do servidor...${NC}"

# Verificar processos Node.js
node_processes=$(ps aux | grep -E "(node|npm).*3001" | grep -v grep)
if [ ! -z "$node_processes" ]; then
    echo "Processos Node.js encontrados:"
    echo "$node_processes"
else
    echo "Nenhum processo Node.js na porta 3001 encontrado"
fi

# Verificar se a porta está em uso
port_check=$(netstat -an 2>/dev/null | grep ":3001" || ss -an 2>/dev/null | grep ":3001" || lsof -i :3001 2>/dev/null)
if [ ! -z "$port_check" ]; then
    echo ""
    echo "Porta 3001 em uso:"
    echo "$port_check"
else
    echo ""
    echo "Porta 3001 não está em uso"
fi

# Cleanup
rm -f "$response_file" "$error_file"

echo ""
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   FIM DO DEBUG${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo -e "${YELLOW}Com base no output acima:${NC}"
echo ""
echo "• Se a query SQL falhou: execute a correção da estrutura"
echo "• Se a API retornou 500: verifique logs do servidor para erro específico"
echo "• Se a API retornou 401: token expirado, faça novo login"
echo "• Se não há processos na porta 3001: inicie o servidor"
echo ""
echo -e "${GREEN}Para corrigir definitivamente:${NC}"
echo "  bash scripts/fix/complete_fix.sh"