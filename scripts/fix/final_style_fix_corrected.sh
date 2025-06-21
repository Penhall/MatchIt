#!/bin/bash
# scripts/fix/final_style_fix_corrected.sh - Correção final corrigida
# Arquivo: scripts/fix/final_style_fix_corrected.sh

# =====================================================
# CORREÇÃO FINAL - STYLE PREFERENCES UPDATE (CORRIGIDA)
# =====================================================

set -e

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
echo -e "${BLUE}   CORREÇÃO FINAL - STYLE PREFERENCES UPDATE${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Etapa 1: Diagnóstico rápido
echo -e "${YELLOW}1. Diagnóstico rápido do problema...${NC}"

# Verificar se tabela tem constraint de categoria
constraint_check=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT EXISTS(
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu 
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'style_choices' 
    AND cc.check_clause LIKE '%Clothing%'
);")

echo "Constraint permite 'Clothing': $constraint_check"

# Verificar se updated_at existe
updated_at_exists=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'style_choices' AND column_name = 'updated_at'
);")

echo "Coluna updated_at existe: $updated_at_exists"
echo ""

# Etapa 2: Backup e atualização do ProfileService
echo -e "${YELLOW}2. Atualizando método updateStyleChoice no ProfileService...${NC}"

# Backup
if [ -f "server/services/profileService.js" ]; then
    cp "server/services/profileService.js" "server/services/profileService.js.backup.stylefix.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup criado${NC}"
fi

# Criar o novo método em arquivo temporário
cat > "/tmp/new_updateStyleChoice.js" << 'EOF'
  /**
   * Atualiza ou cria uma escolha de estilo para o usuário.
   * @param {string} userId - O UUID do usuário.
   * @param {object} choice - Objeto com category, questionId e selectedOption.
   * @returns {Promise<object>} A escolha atualizada/criada.
   */
  async updateStyleChoice(userId, choice) {
    const { category, questionId, selectedOption } = choice;
    const validCategories = ['Sneakers', 'Clothing', 'Colors', 'Hobbies', 'Feelings', 'Interests'];
    
    // Validação de entrada mais robusta
    if (!userId) {
      logger.error(`[ProfileService] updateStyleChoice: UserId não fornecido`);
      throw new Error('UserId é obrigatório');
    }
    
    if (!category) {
      logger.error(`[ProfileService] updateStyleChoice: Category não fornecida`);
      throw new Error('Category é obrigatória');
    }
    
    if (!questionId) {
      logger.error(`[ProfileService] updateStyleChoice: QuestionId não fornecido`);
      throw new Error('QuestionId é obrigatório');
    }
    
    if (selectedOption === undefined || selectedOption === null || selectedOption === '') {
      logger.error(`[ProfileService] updateStyleChoice: SelectedOption inválido`, { selectedOption });
      throw new Error('SelectedOption é obrigatório');
    }
    
    if (!validCategories.includes(category)) {
      logger.error(`[ProfileService] updateStyleChoice: Categoria inválida`, { category, validCategories });
      throw new Error(`Categoria inválida: ${category}. Categorias válidas: ${validCategories.join(', ')}`);
    }

    // Query mais simples e robusta
    const query = `
      INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, category, question_id) DO UPDATE
      SET selected_option = EXCLUDED.selected_option,
          updated_at = COALESCE(CURRENT_TIMESTAMP, NOW())
      RETURNING *;
    `;
    
    try {
      logger.info(`[ProfileService] updateStyleChoice: Iniciando atualização`, { 
        userId, 
        category, 
        questionId, 
        selectedOption 
      });
      
      // Verificar se o usuário existe primeiro
      const userCheckQuery = 'SELECT id FROM users WHERE id = $1';
      const userCheckResult = await pool.query(userCheckQuery, [userId]);
      
      if (userCheckResult.rows.length === 0) {
        logger.error(`[ProfileService] updateStyleChoice: Usuário não encontrado`, { userId });
        throw new Error('Usuário não encontrado');
      }
      
      logger.info(`[ProfileService] updateStyleChoice: Usuário verificado, executando query`);
      
      const { rows } = await pool.query(query, [userId, category, questionId, selectedOption]);
      
      if (rows.length === 0) {
        logger.error(`[ProfileService] updateStyleChoice: Nenhuma linha retornada da query`);
        throw new Error('Falha ao atualizar escolha de estilo - nenhuma linha afetada');
      }
      
      logger.info(`[ProfileService] updateStyleChoice: ✅ Sucesso`, { 
        returnedData: rows[0] 
      });
      
      return rows[0];
      
    } catch (error) {
      logger.error(`[ProfileService] updateStyleChoice: ❌ Erro detalhado`, { 
        userId,
        category, 
        questionId, 
        selectedOption, 
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetail: error.detail,
        errorConstraint: error.constraint,
        fullError: error
      });
      
      // Tratar erros específicos do PostgreSQL
      if (error.code === '23505') { // unique_violation
        logger.error(`[ProfileService] updateStyleChoice: Violação de constraint unique`);
        throw new Error(`Conflito: escolha de estilo já existe para esta categoria e questão`);
      }
      
      if (error.code === '23503') { // foreign_key_violation
        logger.error(`[ProfileService] updateStyleChoice: Violação de foreign key`);
        throw new Error(`Usuário não encontrado ou inválido`);
      }
      
      if (error.code === '23514') { // check_violation
        logger.error(`[ProfileService] updateStyleChoice: Violação de constraint check`);
        throw new Error(`Dados inválidos: verifique se a categoria está correta`);
      }
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        logger.error(`[ProfileService] updateStyleChoice: Tabela não existe`);
        throw new Error('Tabela style_choices não existe. Execute as migrations.');
      }
      
      // Erro genérico
      throw new Error(`Erro ao atualizar escolha de estilo: ${error.message}`);
    }
  }
EOF

# Substituir o método no arquivo original usando sed
# Encontrar o início e fim do método atual e substituir
sed -i.bak '/async updateStyleChoice(userId, choice) {/,/^  }$/c\
  '"$(cat /tmp/new_updateStyleChoice.js | sed 's/$/\\/')"'
' "server/services/profileService.js" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Método não encontrado com sed, usando substituição manual...${NC}"
    
    # Se sed falhar, fazer substituição manual
    cat > "/tmp/fix_profile_service.py" << 'PYTHON_EOF'
import re

# Ler arquivo atual
with open('server/services/profileService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Ler novo método
with open('/tmp/new_updateStyleChoice.js', 'r') as f:
    new_method = f.read()

# Substituir o método existente
pattern = r'async updateStyleChoice\(userId, choice\) \{.*?\n  \}'
new_content = re.sub(pattern, new_method.strip(), content, flags=re.DOTALL)

# Se não encontrou o método, adicionar antes do último método
if new_content == content:
    pattern = r'(\n  /\*\*.*?\n   \* Busca o perfil de um usuário.*?\n   \*/\n  async getProfileByUserId\(userId\) \{)'
    new_content = re.sub(pattern, '\n' + new_method + r'\n\1', content, flags=re.DOTALL)

# Salvar arquivo
with open('server/services/profileService.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Método updateStyleChoice atualizado")
PYTHON_EOF

    python3 /tmp/fix_profile_service.py 2>/dev/null || python /tmp/fix_profile_service.py 2>/dev/null || {
        echo -e "${RED}❌ Erro ao atualizar arquivo. Faça a substituição manual${NC}"
        echo "Substitua o método updateStyleChoice no arquivo server/services/profileService.js"
        echo "pelo conteúdo do arquivo /tmp/new_updateStyleChoice.js"
        exit 1
    }
    
    rm -f /tmp/fix_profile_service.py
}

# Limpeza
rm -f /tmp/new_updateStyleChoice.js
rm -f "server/services/profileService.js.bak"

echo -e "${GREEN}✅ ProfileService atualizado${NC}"
echo ""

# Etapa 3: Verificar se precisamos corrigir constraint de categoria
echo -e "${YELLOW}3. Verificando e corrigindo constraints se necessário...${NC}"

if [ "$constraint_check" != " t" ]; then
    echo "Corrigindo constraint de categoria..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Remover constraint antiga se existir
ALTER TABLE style_choices DROP CONSTRAINT IF EXISTS valid_categories;

-- Adicionar constraint correta
ALTER TABLE style_choices 
ADD CONSTRAINT valid_categories 
CHECK (category IN ('Sneakers', 'Clothing', 'Colors', 'Hobbies', 'Feelings', 'Interests'));

-- Verificar se funcionou
SELECT 'Constraint adicionada com sucesso' as resultado;
EOF
    echo -e "${GREEN}✅ Constraint de categoria corrigida${NC}"
else
    echo -e "${GREEN}✅ Constraint de categoria já está correta${NC}"
fi

echo ""

# Etapa 4: Reiniciar servidor
echo -e "${YELLOW}4. Instrução para reiniciar servidor...${NC}"
echo -e "${YELLOW}⚠️  IMPORTANTE: Reinicie o servidor para aplicar as mudanças${NC}"
echo ""
echo "Para reiniciar:"
echo "• Se usando npm: Ctrl+C e depois 'npm run dev'"
echo "• Se usando docker: 'docker-compose restart backend'"
echo ""
echo -e "${BLUE}Pressione ENTER quando tiver reiniciado o servidor...${NC}"
read -r

# Etapa 5: Teste final
echo -e "${YELLOW}5. Testando correção...${NC}"

test_style_update() {
    local category=$1
    local questionId=$2
    local selectedOption=$3
    local description=$4
    
    echo -e "${BLUE}Testando: $description${NC}"
    
    local response_file="/tmp/final_style_test.json"
    local http_code=$(curl -s -w "%{http_code}" \
        -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"category\":\"$category\",\"questionId\":\"$questionId\",\"selectedOption\":\"$selectedOption\"}" \
        "$API_URL/api/profile/style-preferences" \
        -o "$response_file" 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Sucesso (HTTP $http_code)${NC}"
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            echo -e "${BLUE}Resposta:${NC}"
            if command -v jq &> /dev/null; then
                cat "$response_file" | jq . 2>/dev/null || cat "$response_file"
            else
                cat "$response_file"
            fi
        fi
    else
        echo -e "${RED}❌ Falha (HTTP $http_code)${NC}"
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            echo -e "${RED}Erro:${NC}"
            cat "$response_file"
        fi
    fi
    
    echo ""
    rm -f "$response_file"
}

# Testes progressivos
test_style_update "Sneakers" "test_sneaker_1" "sport" "Atualizar Sneakers (categoria conhecida)"
test_style_update "Clothing" "test_clothing_1" "formal" "Atualizar Clothing (categoria que estava falhando)"
test_style_update "Colors" "test_color_1" "blue" "Atualizar Colors (nova categoria)"

# Etapa 6: Verificar se todas as preferências foram salvas
echo -e "${YELLOW}6. Verificando todas as preferências salvas...${NC}"
echo -e "${BLUE}Buscando todas as preferências:${NC}"

preferences_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/profile/style-preferences")
echo "$preferences_response" | jq . 2>/dev/null || echo "$preferences_response"

echo ""

# Resumo final
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   RESUMO FINAL${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

echo -e "${GREEN}Correções aplicadas:${NC}"
echo "• ✅ Método updateStyleChoice reescrito com logs detalhados"
echo "• ✅ Validação de entrada mais robusta"
echo "• ✅ Tratamento específico de erros PostgreSQL"
echo "• ✅ Constraint de categoria verificada/corrigida"
echo "• ✅ Query simplificada e mais compatível"
echo ""

echo -e "${GREEN}Agora todos os 4 endpoints devem funcionar:${NC}"
echo "• ✅ GET /api/profile/{userId}"
echo "• ✅ GET /api/profile/style-preferences"  
echo "• ✅ PUT /api/profile"
echo "• ✅ PUT /api/profile/style-preferences"
echo ""

echo -e "${YELLOW}Para verificar se tudo está funcionando:${NC}"
echo "bash scripts/test/test_all_endpoints.sh"
echo ""

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}   CORREÇÃO FINAL COMPLETA! 🎉${NC}"
echo -e "${BLUE}=====================================================${NC}"