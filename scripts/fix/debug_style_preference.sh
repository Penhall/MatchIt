#!/bin/bash
# scripts/fix/debug_style_preference.sh - Debug específico do problema de style preferences
# Arquivo: scripts/fix/debug_style_preference.sh

# =====================================================
# DEBUG ESPECÍFICO - STYLE PREFERENCES UPDATE
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
echo -e "${BLUE}   DEBUG: PROBLEMA STYLE PREFERENCES UPDATE${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# 1. Verificar estrutura da tabela style_choices
echo -e "${YELLOW}1. Verificando estrutura da tabela style_choices...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Estrutura da tabela
\d style_choices;

-- Constraints e índices
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
WHERE tc.table_name = 'style_choices';
EOF

echo ""

# 2. Verificar dados atuais
echo -e "${YELLOW}2. Verificando dados atuais na tabela...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Dados atuais do usuário
SELECT * FROM style_choices WHERE user_id = '$USER_ID';
EOF

echo ""

# 3. Testar a query específica que está falhando
echo -e "${YELLOW}3. Testando query específica do updateStyleChoice...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Teste da query exata (simulando dados que serão enviados)
BEGIN;

-- Tentar inserir/atualizar uma preferência
INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
VALUES ('$USER_ID', 'Clothing', 'clothing_test', 'corrected', NOW())
ON CONFLICT (user_id, category, question_id) DO UPDATE
SET selected_option = EXCLUDED.selected_option,
    updated_at = NOW()
RETURNING *;

ROLLBACK; -- Não aplicar a mudança, só testar
EOF

echo ""

# 4. Testar validação de categorias
echo -e "${YELLOW}4. Testando validação de categorias...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Verificar constraint de categorias válidas
SELECT 
    cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu 
    ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'style_choices';
EOF

echo ""

# 5. Testar requisição com dados simples
echo -e "${YELLOW}5. Testando API com dados mais simples...${NC}"

test_simple_data() {
    local category=$1
    local questionId=$2
    local selectedOption=$3
    local description=$4
    
    echo -e "${BLUE}Testando: $description${NC}"
    echo "Dados: category=$category, questionId=$questionId, selectedOption=$selectedOption"
    
    local response_file="/tmp/style_debug.json"
    local http_code=$(curl -s -w "%{http_code}" \
        -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"category\":\"$category\",\"questionId\":\"$questionId\",\"selectedOption\":\"$selectedOption\"}" \
        "$API_URL/api/profile/style-preferences" \
        -o "$response_file" 2>/dev/null)
    
    echo "Status HTTP: $http_code"
    
    if [ -f "$response_file" ] && [ -s "$response_file" ]; then
        echo "Resposta:"
        cat "$response_file"
    fi
    
    echo ""
    rm -f "$response_file"
}

# Testar diferentes categorias
test_simple_data "Sneakers" "test_1" "option_1" "Categoria Sneakers (válida)"
test_simple_data "Clothing" "test_2" "option_2" "Categoria Clothing (válida)" 
test_simple_data "Colors" "test_3" "option_3" "Categoria Colors (válida)"
test_simple_data "InvalidCategory" "test_4" "option_4" "Categoria inválida (deve falhar)"

# 6. Verificar logs do servidor
echo -e "${YELLOW}6. Verificando logs recentes do servidor...${NC}"

if [ -f "server.log" ]; then
    echo "Últimas 15 linhas do server.log relacionadas a style:"
    tail -50 server.log | grep -i -A 3 -B 3 "style\|preference\|error" | tail -15
elif docker ps | grep -q "backend\|matchit"; then
    echo "Últimas linhas dos logs do Docker relacionadas a style:"
    container_id=$(docker ps | grep -E "backend|matchit" | head -1 | cut -d' ' -f1)
    if [ ! -z "$container_id" ]; then
        docker logs --tail=50 "$container_id" | grep -i -A 3 -B 3 "style\|preference\|error" | tail -15
    fi
else
    echo "Logs não encontrados. Execute o servidor com logs habilitados."
fi

echo ""

# 7. Sugestões de próximos passos
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   ANÁLISE E PRÓXIMOS PASSOS${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

echo -e "${YELLOW}Com base no output acima:${NC}"
echo ""
echo "1. Se a constraint de categoria falhou:"
echo "   → Categoria 'Clothing' pode não estar permitida"
echo "   → Verifique se constraint permite essa categoria"
echo ""
echo "2. Se a query SQL falhou:"
echo "   → Pode ser problema de constraint unique"
echo "   → Pode ser problema de coluna faltante"
echo ""
echo "3. Se houve erro de validação:"
echo "   → Dados podem estar em formato incorreto"
echo "   → Validação do ProfileService pode estar muito restritiva"
echo ""
echo "4. Se logs mostrarem erro específico:"
echo "   → Seguir a mensagem de erro exata"
echo ""

echo -e "${GREEN}Para corrigir baseado no diagnóstico:${NC}"
echo "• Se constraint: Ajustar valid_categories na tabela"
echo "• Se query: Corrigir updateStyleChoice no ProfileService"  
echo "• Se validação: Ajustar validação no ProfileService"
echo ""

echo -e "${BLUE}=====================================================${NC}"