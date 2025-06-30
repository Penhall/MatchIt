#!/bin/bash
# scripts/debug-erro-imagens.sh - Capturar erro específico da API de imagens

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 DEBUG ESPECÍFICO: ERRO API DE IMAGENS${NC}"
echo ""
echo -e "${YELLOW}🎯 OBJETIVO:${NC}"
echo -e "   • Capturar erro específico do servidor"
echo -e "   • Identificar causa exata do HTTP 500"
echo -e "   • Aplicar correção direcionada"
echo ""

echo -e "${BLUE}▶ ETAPA 1: Testar API e acompanhar logs${NC}"

echo -e "${YELLOW}   Fazendo requisição para capturar erro...${NC}"

# Fazer requisição e capturar resposta detalhada
API_RESPONSE=$(curl -s -v http://localhost:3000/api/tournament/images 2>&1)

echo "Resposta completa da API:"
echo "$API_RESPONSE"
echo ""

# Extrair apenas o JSON da resposta
JSON_RESPONSE=$(echo "$API_RESPONSE" | grep -E '^\{.*\}$' | tail -1)

echo "JSON extraído: $JSON_RESPONSE"
echo ""

echo -e "${BLUE}▶ ETAPA 2: Verificar estrutura da tabela${NC}"

# Credenciais do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
export PGPASSWORD="matchit123"

echo -e "${YELLOW}   Verificando estrutura da tabela tournament_images...${NC}"

TABLE_STRUCTURE=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
\d tournament_images
" 2>/dev/null)

echo "Estrutura da tabela:"
echo "$TABLE_STRUCTURE"
echo ""

echo -e "${YELLOW}   Testando query diretamente no banco...${NC}"

# Testar a mesma query que a API usa
DIRECT_QUERY=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT * FROM tournament_images WHERE approved = true ORDER BY upload_date DESC LIMIT 10;
" 2>&1)

echo "Resultado da query direta:"
echo "$DIRECT_QUERY"
echo ""

# Verificar se query funciona
if echo "$DIRECT_QUERY" | grep -q "ERROR"; then
    echo -e "${RED}❌ Erro na query SQL${NC}"
    
    # Testar query alternativa
    echo -e "${YELLOW}   Testando query alternativa...${NC}"
    
    ALT_QUERY=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT id, category, image_url, alt_text FROM tournament_images LIMIT 5;
    " 2>&1)
    
    echo "Query alternativa:"
    echo "$ALT_QUERY"
    
else
    echo -e "${GREEN}✅ Query SQL funciona no banco${NC}"
fi

echo -e "${BLUE}▶ ETAPA 3: Verificar implementação da rota${NC}"

if [[ -f "server/routes/tournament.js" ]]; then
    echo -e "${YELLOW}   Examinando código da rota /images...${NC}"
    
    # Extrair código da rota de imagens
    echo "Código da rota /images:"
    sed -n '/router\.get.*\/images/,/^}/p' server/routes/tournament.js | head -30
    echo ""
    
    # Verificar se usa pool corretamente
    if grep -A 20 "router.get('/images'" server/routes/tournament.js | grep -q "pool.query"; then
        echo -e "${GREEN}✅ Usa pool.query corretamente${NC}"
    else
        echo -e "${RED}❌ Pode não estar usando pool corretamente${NC}"
    fi
    
    # Verificar se importa pool
    if grep -q "import.*pool.*from" server/routes/tournament.js; then
        echo -e "${GREEN}✅ Importa pool${NC}"
        grep "import.*pool" server/routes/tournament.js
    else
        echo -e "${RED}❌ Pode não estar importando pool${NC}"
    fi
    
else
    echo -e "${RED}❌ Arquivo tournament.js não encontrado${NC}"
fi

echo -e "${BLUE}▶ ETAPA 4: Criar versão corrigida da rota${NC}"

echo -e "${YELLOW}   Criando versão corrigida...${NC}"

# Backup do arquivo atual
cp server/routes/tournament.js server/routes/tournament.js.backup.debug

# Verificar as primeiras linhas para ver as importações
echo "Importações atuais:"
head -10 server/routes/tournament.js
echo ""

# Criar versão corrigida da rota de imagens
cat > temp_images_route.js << 'EOF'
/**
 * GET /api/tournament/images - VERSÃO CORRIGIDA
 * Listar imagens disponíveis
 */
router.get('/images', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    console.log('🖼️ [DEBUG] Buscando imagens, categoria:', category);
    console.log('🖼️ [DEBUG] Limite:', limit);
    
    let query = 'SELECT id, category, image_url, alt_text, approved, upload_date FROM tournament_images WHERE approved = true';
    let params = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
      console.log('🖼️ [DEBUG] Filtro categoria aplicado:', category);
    }
    
    query += ' ORDER BY upload_date DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));
    
    console.log('🖼️ [DEBUG] Query final:', query);
    console.log('🖼️ [DEBUG] Parâmetros:', params);
    
    const result = await pool.query(query, params);
    
    console.log('🖼️ [DEBUG] Resultado rows:', result.rows.length);

    res.json({
      success: true,
      images: result.rows,
      total: result.rows.length,
      category: category || 'all'
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erro detalhado na API de imagens:');
    console.error('   Tipo:', error.name);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar imagens',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
EOF

echo -e "${GREEN}✅ Versão corrigida criada${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} 🔍 DEBUG CONCLUÍDO${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Analisar logs do servidor que aparecem quando você executou este script${NC}"
echo -e "${YELLOW}2. Se quiser aplicar versão corrigida com debug:${NC}"
echo -e "   ${BLUE}# Substituir rota atual pela versão com debug${NC}"
echo -e "   ${BLUE}# Reiniciar servidor${NC}"
echo -e "   ${BLUE}# Testar novamente${NC}"
echo ""

echo -e "${YELLOW}💡 INFORMAÇÕES CAPTURADAS:${NC}"
echo -e "   • Resposta detalhada da API"
echo -e "   • Estrutura real da tabela"
echo -e "   • Teste da query no banco"
echo -e "   • Análise do código da rota"
echo ""

echo -e "${BLUE}📋 Com essas informações, posso criar correção específica!${NC}"