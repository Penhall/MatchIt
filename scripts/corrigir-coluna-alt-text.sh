#!/bin/bash
# scripts/corrigir-coluna-alt-text.sh - Correção específica do problema alt_text

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 CORREÇÃO ESPECÍFICA: COLUNA ALT_TEXT${NC}"
echo ""
echo -e "${GREEN}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   ❌ Query usa coluna 'alt_text' que não existe"
echo -e "   ❌ Erro: coluna \"alt_text\" não existe"
echo ""
echo -e "${YELLOW}🛠️ SOLUÇÃO: Adicionar coluna alt_text à tabela${NC}"
echo ""

# Credenciais do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
export PGPASSWORD="matchit123"

echo -e "${BLUE}▶ ETAPA 1: Verificar estrutura atual da tabela${NC}"

TABLE_STRUCTURE=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d tournament_images" 2>/dev/null)

echo "Estrutura atual:"
echo "$TABLE_STRUCTURE"
echo ""

# Verificar se coluna alt_text existe
if echo "$TABLE_STRUCTURE" | grep -q "alt_text"; then
    echo -e "${GREEN}✅ Coluna 'alt_text' já existe${NC}"
    ALT_TEXT_EXISTS=true
else
    echo -e "${YELLOW}⚠️ Coluna 'alt_text' não existe${NC}"
    ALT_TEXT_EXISTS=false
fi

echo -e "${BLUE}▶ ETAPA 2: Adicionar coluna alt_text${NC}"

if [[ "$ALT_TEXT_EXISTS" == false ]]; then
    echo -e "${YELLOW}   Adicionando coluna 'alt_text'...${NC}"
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    -- Adicionar coluna alt_text
    ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
    
    -- Preencher com valores baseados no title (se existir) ou descrição padrão
    UPDATE tournament_images 
    SET alt_text = COALESCE(title, 'Imagem de ' || category)
    WHERE alt_text IS NULL;
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Coluna 'alt_text' adicionada e populada${NC}"
else
    echo -e "${GREEN}✅ Coluna 'alt_text' já existe, nada a fazer${NC}"
fi

echo -e "${BLUE}▶ ETAPA 3: Verificar se há dados na tabela${NC}"

IMAGES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)

echo -e "${YELLOW}   Imagens na tabela: $IMAGES_COUNT${NC}"

if [[ "$IMAGES_COUNT" == "0" ]]; then
    echo -e "${YELLOW}   Inserindo dados de exemplo...${NC}"
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    -- Inserir dados de exemplo com alt_text
    INSERT INTO tournament_images (category, image_url, alt_text, title, approved, upload_date) VALUES
    ('cores', 'https://picsum.photos/400/400?random=1', 'Cor azul vibrante', 'Azul Oceano', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=2', 'Cor vermelha intensa', 'Vermelho Paixão', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=3', 'Cor verde natural', 'Verde Floresta', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=4', 'Cor amarela radiante', 'Amarelo Sol', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=5', 'Estilo casual moderno', 'Casual Urbano', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=6', 'Estilo formal elegante', 'Formal Clássico', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=7', 'Estilo boêmio livre', 'Boho Chic', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=8', 'Estilo minimalista clean', 'Minimalista', true, NOW()),
    ('acessorios', 'https://picsum.photos/300/300?random=9', 'Relógio clássico elegante', 'Relógio Vintage', true, NOW()),
    ('acessorios', 'https://picsum.photos/300/300?random=10', 'Óculos modernos estilosos', 'Óculos Trend', true, NOW()),
    ('calcados', 'https://picsum.photos/400/300?random=11', 'Tênis esportivo confortável', 'Sneaker Sport', true, NOW()),
    ('calcados', 'https://picsum.photos/400/300?random=12', 'Sapato social refinado', 'Social Premium', true, NOW()),
    ('texturas', 'https://picsum.photos/400/400?random=13', 'Textura natural orgânica', 'Madeira Natural', true, NOW()),
    ('texturas', 'https://picsum.photos/400/400?random=14', 'Textura metálica moderna', 'Metal Escovado', true, NOW())
    ON CONFLICT DO NOTHING;
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Dados de exemplo inseridos com alt_text${NC}"
fi

echo -e "${BLUE}▶ ETAPA 4: Testar query corrigida${NC}"

echo -e "${YELLOW}   Testando query com alt_text...${NC}"

# Testar query que agora deve funcionar
QUERY_TEST=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, category, image_url, alt_text, upload_date 
FROM tournament_images 
ORDER BY upload_date DESC 
LIMIT 3;
" 2>&1)

if echo "$QUERY_TEST" | grep -q "ERROR"; then
    echo -e "${RED}❌ Query ainda com problemas:${NC}"
    echo "$QUERY_TEST"
else
    echo -e "${GREEN}✅ Query funciona perfeitamente!${NC}"
    echo "Primeiros registros:"
    echo "$QUERY_TEST"
fi

echo -e "${BLUE}▶ ETAPA 5: Verificar rota da API${NC}"

# Mostrar rota atual para verificação
if [[ -f "server/routes/tournament.js" ]]; then
    echo -e "${YELLOW}   Código atual da rota /images:${NC}"
    sed -n '/router\.get.*\/images/,/^});/p' server/routes/tournament.js | head -20
    echo ""
    
    if grep -A 10 "router.get.*images" server/routes/tournament.js | grep -q "alt_text"; then
        echo -e "${GREEN}✅ Rota já usa alt_text corretamente${NC}"
    else
        echo -e "${YELLOW}⚠️ Rota pode precisar de atualização${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo tournament.js não encontrado${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ CORREÇÃO DA COLUNA ALT_TEXT APLICADA!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Reiniciar servidor (se estiver rodando):${NC}"
echo -e "   ${BLUE}Ctrl+C${NC} (parar servidor)"
echo -e "   ${BLUE}npm run server${NC}"
echo ""
echo -e "${YELLOW}2. Testar API corrigida:${NC}"
echo -e "   ${BLUE}./scripts/test-final-completo.sh${NC}"
echo ""
echo -e "${GREEN}🎯 RESULTADO ESPERADO:${NC}"
echo -e "   Taxa de sucesso: 100% (8/8 testes)"
echo -e "   🎉 PROBLEMA DA COLUNA ALT_TEXT RESOLVIDO!"
echo ""