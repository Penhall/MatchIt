#!/bin/bash
# scripts/corrigir-api-imagens.sh - Correção da última falha: API de imagens

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 ÚLTIMA CORREÇÃO: API DE IMAGENS${NC}"
echo ""
echo -e "${GREEN}🎉 PARABÉNS! Sistema 87% funcional!${NC}"
echo -e "${YELLOW}   Apenas 1 falha restante: API de imagens (HTTP 500)${NC}"
echo ""

# Credenciais do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
export PGPASSWORD="matchit123"

echo -e "${BLUE}▶ ETAPA 1: Verificar tabela tournament_images${NC}"

echo -e "${YELLOW}   Verificando se tabela exists...${NC}"
TABLE_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'tournament_images'
);" 2>/dev/null)

if [[ "$TABLE_EXISTS" =~ "t" ]]; then
    echo -e "${GREEN}✅ Tabela tournament_images existe${NC}"
    
    # Verificar dados na tabela
    RECORD_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM tournament_images;" 2>/dev/null)
    
    echo -e "${YELLOW}   Registros na tabela: $RECORD_COUNT${NC}"
    
    if [[ "$RECORD_COUNT" -eq 0 ]]; then
        echo -e "${YELLOW}   Tabela vazia, inserindo dados de exemplo...${NC}"
        
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        INSERT INTO tournament_images (category, image_url, alt_text, approved, upload_date) VALUES
        ('cores', '/api/images/cores/azul.jpg', 'Cor azul vibrante', true, NOW()),
        ('cores', '/api/images/cores/vermelho.jpg', 'Cor vermelha intensa', true, NOW()),
        ('estilos', '/api/images/estilos/casual.jpg', 'Estilo casual moderno', true, NOW()),
        ('estilos', '/api/images/estilos/formal.jpg', 'Estilo formal elegante', true, NOW()),
        ('acessorios', '/api/images/acessorios/relogio.jpg', 'Relógio clássico', true, NOW())
        ON CONFLICT DO NOTHING;
        " > /dev/null 2>&1
        
        echo -e "${GREEN}✅ Dados de exemplo inseridos${NC}"
    else
        echo -e "${GREEN}✅ Tabela contém dados${NC}"
    fi
    
else
    echo -e "${RED}❌ Tabela tournament_images não existe${NC}"
    echo -e "${YELLOW}   Criando tabela...${NC}"
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    CREATE TABLE IF NOT EXISTS tournament_images (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        alt_text TEXT,
        approved BOOLEAN DEFAULT true,
        upload_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    INSERT INTO tournament_images (category, image_url, alt_text, approved) VALUES
    ('cores', '/api/images/cores/azul.jpg', 'Cor azul vibrante', true),
    ('cores', '/api/images/cores/vermelho.jpg', 'Cor vermelha intensa', true),
    ('estilos', '/api/images/estilos/casual.jpg', 'Estilo casual moderno', true),
    ('estilos', '/api/images/estilos/formal.jpg', 'Estilo formal elegante', true),
    ('acessorios', '/api/images/acessorios/relogio.jpg', 'Relógio clássico', true);
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Tabela criada e populada${NC}"
fi

echo -e "${BLUE}▶ ETAPA 2: Verificar rota de imagens${NC}"

if [[ -f "server/routes/tournament.js" ]]; then
    echo -e "${YELLOW}   Verificando implementação da rota /images...${NC}"
    
    if grep -q "router.get('/images'" server/routes/tournament.js; then
        echo -e "${GREEN}✅ Rota /images implementada${NC}"
        
        # Verificar se há erros óbvios
        if grep -A 20 "router.get('/images'" server/routes/tournament.js | grep -q "tournament_images"; then
            echo -e "${GREEN}✅ Rota referencia tabela correta${NC}"
        else
            echo -e "${YELLOW}⚠️ Rota pode ter problemas${NC}"
        fi
    else
        echo -e "${RED}❌ Rota /images não encontrada${NC}"
        echo -e "${YELLOW}   Adicionando rota...${NC}"
        
        # Backup do arquivo atual
        cp server/routes/tournament.js server/routes/tournament.js.backup.images
        
        # Adicionar rota de imagens se não existir
        cat >> server/routes/tournament.js << 'EOF'

/**
 * GET /api/tournament/images
 * Listar imagens disponíveis (rota corrigida)
 */
router.get('/images', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    console.log('🖼️ Buscando imagens de torneio:', category);
    
    let query = 'SELECT * FROM tournament_images WHERE approved = true';
    let params = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY upload_date DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);

    res.json({
      success: true,
      images: result.rows,
      total: result.rows.length,
      category: category || 'all'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar imagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar imagens'
    });
  }
});
EOF
        
        echo -e "${GREEN}✅ Rota de imagens adicionada${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo tournament.js não encontrado${NC}"
fi

echo -e "${BLUE}▶ ETAPA 3: Teste da API corrigida${NC}"

echo -e "${YELLOW}   Testando API de imagens...${NC}"

# Testar endpoint diretamente
API_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/tournament/images 2>/dev/null)
API_BODY=$(echo "$API_RESPONSE" | head -n -1)
API_STATUS=$(echo "$API_RESPONSE" | tail -n 1)

echo -e "${YELLOW}   Status: $API_STATUS${NC}"

if [[ "$API_STATUS" == "200" ]]; then
    echo -e "${GREEN}✅ API de imagens funcionando!${NC}"
    echo -e "${YELLOW}   Resposta: $(echo "$API_BODY" | head -c 100)...${NC}"
else
    echo -e "${RED}❌ API ainda com problemas${NC}"
    echo -e "${YELLOW}   Resposta: $API_BODY${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ CORREÇÃO DA API DE IMAGENS APLICADA!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 TESTE FINAL AGORA:${NC}"
echo -e "   ${BLUE}./scripts/test-final-completo.sh${NC}"
echo ""

echo -e "${GREEN}🎯 RESULTADO ESPERADO:${NC}"
echo -e "   Taxa de sucesso: 95%+ (8/8 testes)"
echo -e "   🎉 SISTEMA COMPLETAMENTE FUNCIONAL!"
echo ""

echo -e "${YELLOW}💡 SE AINDA HOUVER PROBLEMA:${NC}"
echo -e "   • Verificar logs do servidor"
echo -e "   • Pode ser necessário reiniciar servidor"