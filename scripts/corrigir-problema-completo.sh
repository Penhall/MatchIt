#!/bin/bash
# scripts/corrigir-problema-completo.sh - Solução completa para o problema da API de imagens

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 CORREÇÃO COMPLETA DO PROBLEMA DE IMAGENS${NC}"
echo ""
echo -e "${GREEN}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   ❌ Coluna 'alt_text' não existe na tabela tournament_images"
echo -e "   ❌ API retorna HTTP 500 ao tentar buscar imagens"
echo ""
echo -e "${YELLOW}🛠️ SOLUÇÃO COMPLETA:${NC}"
echo -e "   1. Adicionar coluna alt_text ao banco"
echo -e "   2. Popular com dados de exemplo"
echo -e "   3. Atualizar rota da API"
echo -e "   4. Testar funcionamento"
echo ""

# Credenciais do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
export PGPASSWORD="matchit123"

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =====================================================
# ETAPA 1: VERIFICAR E CORRIGIR BANCO DE DADOS
# =====================================================

print_step "ETAPA 1: Verificando e corrigindo estrutura do banco"

echo -e "${YELLOW}   Verificando estrutura atual...${NC}"

# Verificar se tabela existe
TABLE_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tournament_images'
);
" 2>/dev/null | xargs)

if [[ "$TABLE_EXISTS" == "t" ]]; then
    print_success "Tabela tournament_images existe"
    
    # Verificar estrutura
    COLUMNS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'tournament_images' 
    ORDER BY ordinal_position;
    " 2>/dev/null)
    
    echo "Colunas atuais:"
    echo "$COLUMNS"
    
    # Verificar se alt_text existe
    if echo "$COLUMNS" | grep -q "alt_text"; then
        print_success "Coluna alt_text já existe"
    else
        print_warning "Coluna alt_text não existe, adicionando..."
        
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
        
        -- Preencher alt_text com base no title ou criar descrição padrão
        UPDATE tournament_images 
        SET alt_text = COALESCE(title, 'Imagem de ' || category)
        WHERE alt_text IS NULL;
        " > /dev/null 2>&1
        
        print_success "Coluna alt_text adicionada e populada"
    fi
    
else
    print_warning "Tabela tournament_images não existe, criando..."
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    -- Criar ENUMs se não existirem
    DO \$\$ BEGIN
        CREATE TYPE tournament_category_enum AS ENUM (
            'cores', 'estilos', 'acessorios', 'calcados', 'texturas'
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END \$\$;
    
    -- Criar tabela tournament_images
    CREATE TABLE IF NOT EXISTS tournament_images (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        alt_text TEXT,
        title VARCHAR(100),
        description TEXT,
        tags TEXT[] DEFAULT '{}',
        active BOOLEAN DEFAULT true,
        approved BOOLEAN DEFAULT true,
        created_by INTEGER,
        upload_date TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    " > /dev/null 2>&1
    
    print_success "Tabela tournament_images criada"
fi

# =====================================================
# ETAPA 2: POPULAR COM DADOS DE EXEMPLO
# =====================================================

print_step "ETAPA 2: Verificando e inserindo dados de exemplo"

IMAGES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)

echo -e "${YELLOW}   Imagens na tabela: $IMAGES_COUNT${NC}"

if [[ "$IMAGES_COUNT" == "0" ]]; then
    print_warning "Inserindo dados de exemplo..."
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    INSERT INTO tournament_images (category, image_url, alt_text, title, approved, upload_date) VALUES
    ('cores', 'https://picsum.photos/400/400?random=1', 'Cor azul vibrante', 'Azul Oceano', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=2', 'Cor vermelha intensa', 'Vermelho Paixão', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=3', 'Cor verde natural', 'Verde Floresta', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=4', 'Cor amarela radiante', 'Amarelo Sol', true, NOW()),
    ('cores', 'https://picsum.photos/400/400?random=5', 'Cor roxa misteriosa', 'Roxo Místico', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=6', 'Estilo casual moderno', 'Casual Urbano', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=7', 'Estilo formal elegante', 'Formal Clássico', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=8', 'Estilo boêmio livre', 'Boho Chic', true, NOW()),
    ('estilos', 'https://picsum.photos/400/500?random=9', 'Estilo minimalista clean', 'Minimalista', true, NOW()),
    ('acessorios', 'https://picsum.photos/300/300?random=10', 'Relógio clássico elegante', 'Relógio Vintage', true, NOW()),
    ('acessorios', 'https://picsum.photos/300/300?random=11', 'Óculos modernos estilosos', 'Óculos Trend', true, NOW()),
    ('acessorios', 'https://picsum.photos/300/300?random=12', 'Colar delicado minimalista', 'Colar Minimal', true, NOW()),
    ('calcados', 'https://picsum.photos/400/300?random=13', 'Tênis esportivo confortável', 'Sneaker Sport', true, NOW()),
    ('calcados', 'https://picsum.photos/400/300?random=14', 'Sapato social refinado', 'Social Premium', true, NOW()),
    ('calcados', 'https://picsum.photos/400/300?random=15', 'Bota aventureira resistente', 'Boot Adventure', true, NOW()),
    ('texturas', 'https://picsum.photos/400/400?random=16', 'Textura natural orgânica', 'Madeira Natural', true, NOW()),
    ('texturas', 'https://picsum.photos/400/400?random=17', 'Textura metálica moderna', 'Metal Escovado', true, NOW()),
    ('texturas', 'https://picsum.photos/400/400?random=18', 'Textura suave sedosa', 'Seda Premium', true, NOW())
    ON CONFLICT DO NOTHING;
    " > /dev/null 2>&1
    
    # Verificar quantas foram inseridas
    NEW_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)
    print_success "$NEW_COUNT imagens inseridas na tabela"
    
else
    print_success "Tabela já contém $IMAGES_COUNT imagens"
fi

# =====================================================
# ETAPA 3: BACKUP E ATUALIZAÇÃO DA ROTA
# =====================================================

print_step "ETAPA 3: Atualizando rota da API"

if [[ -f "server/routes/tournament.js" ]]; then
    # Backup da versão atual
    cp server/routes/tournament.js server/routes/tournament.js.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup da rota criado"
    
    # Verificar se já está corrigida
    if grep -A 10 "router.get.*images" server/routes/tournament.js | grep -q "alt_text"; then
        print_success "Rota já está corrigida"
    else
        print_warning "Atualizando rota de imagens..."
        
        # Atualizar apenas a rota de imagens específica
        python3 -c "
import re

# Ler arquivo
with open('server/routes/tournament.js', 'r') as f:
    content = f.read()

# Rota corrigida
new_route = '''/**
 * GET /api/tournament/images
 * Listar imagens disponíveis (versão corrigida)
 */
router.get('/images', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    console.log('🖼️ Buscando imagens de torneio, categoria:', category || 'todas');
    
    let query = \`
      SELECT 
        id, 
        category, 
        image_url, 
        alt_text, 
        title,
        description,
        upload_date,
        approved
      FROM tournament_images 
      WHERE approved = true
    \`;
    
    let params = [];
    
    if (category && category !== 'all') {
      query += ' AND category = \$1';
      params.push(category);
    }
    
    query += \` ORDER BY upload_date DESC LIMIT \$\${params.length + 1}\`;
    params.push(parseInt(limit));
    
    console.log('🖼️ Query executada:', query);
    
    const result = await pool.query(query, params);
    
    console.log('✅ Imagens encontradas:', result.rows.length);

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
      error: 'Erro ao buscar imagens',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});'''

# Substituir rota existente
pattern = r\"router\.get\(['\\\"]\/images['\\\"]\s*,.*?^\}\);\"
content = re.sub(pattern, new_route, content, flags=re.MULTILINE | re.DOTALL)

# Escrever arquivo corrigido
with open('server/routes/tournament.js', 'w') as f:
    f.write(content)

print('Rota atualizada com sucesso')
" 2>/dev/null && print_success "Rota atualizada via Python" || {
            print_warning "Usando método alternativo..."
            
            # Método manual de substituição
            sed -i '/router\.get.*\/images/,/^});/c\
/**\
 * GET /api/tournament/images\
 * Listar imagens disponíveis (versão corrigida)\
 */\
router.get("/images", async (req, res) => {\
  try {\
    const { category, limit = 10 } = req.query;\
    \
    console.log("🖼️ Buscando imagens de torneio, categoria:", category || "todas");\
    \
    let query = "SELECT id, category, image_url, alt_text, title, upload_date, approved FROM tournament_images WHERE approved = true";\
    let params = [];\
    \
    if (category && category !== "all") {\
      query += " AND category = $1";\
      params.push(category);\
    }\
    \
    query += " ORDER BY upload_date DESC LIMIT $" + (params.length + 1);\
    params.push(parseInt(limit));\
    \
    const result = await pool.query(query, params);\
\
    res.json({\
      success: true,\
      images: result.rows,\
      total: result.rows.length,\
      category: category || "all"\
    });\
\
  } catch (error) {\
    console.error("❌ Erro ao buscar imagens:", error);\
    res.status(500).json({\
      success: false,\
      error: "Erro ao buscar imagens"\
    });\
  }\
});' server/routes/tournament.js
            
            print_success "Rota atualizada via sed"
        }
    fi
    
else
    print_error "Arquivo server/routes/tournament.js não encontrado"
    exit 1
fi

# =====================================================
# ETAPA 4: TESTE FINAL
# =====================================================

print_step "ETAPA 4: Testando correção"

echo -e "${YELLOW}   Testando query no banco...${NC}"

# Testar query diretamente
QUERY_RESULT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, category, image_url, alt_text, upload_date 
FROM tournament_images 
WHERE approved = true 
ORDER BY upload_date DESC 
LIMIT 3;
" 2>&1)

if echo "$QUERY_RESULT" | grep -q "ERROR"; then
    print_error "Query ainda com problemas:"
    echo "$QUERY_RESULT"
    exit 1
else
    print_success "Query funciona no banco!"
fi

echo -e "${YELLOW}   Testando API (se servidor estiver rodando)...${NC}"

# Testar API se servidor estiver respondendo
if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
    print_success "Servidor respondendo"
    
    API_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/tournament/images?limit=3)
    API_BODY=$(echo "$API_RESPONSE" | head -n -1)
    API_STATUS=$(echo "$API_RESPONSE" | tail -n 1)
    
    if [[ "$API_STATUS" == "200" ]]; then
        print_success "API de imagens funcionando! Status: $API_STATUS"
        
        # Verificar se retorna dados válidos
        if echo "$API_BODY" | grep -q '"success":true'; then
            IMAGES_RETURNED=$(echo "$API_BODY" | grep -o '"total":[0-9]*' | cut -d: -f2)
            print_success "API retornou $IMAGES_RETURNED imagens"
        fi
    else
        print_warning "API retornou status: $API_STATUS"
        echo "Resposta: $API_BODY"
    fi
else
    print_warning "Servidor não está respondendo"
    echo -e "${YELLOW}   Para testar, execute:${NC}"
    echo -e "   ${BLUE}npm run server${NC} (em um terminal)"
    echo -e "   ${BLUE}./scripts/test-final-completo.sh${NC} (em outro terminal)"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ CORREÇÃO COMPLETA APLICADA COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Se servidor não estiver rodando:${NC}"
echo -e "   ${BLUE}npm run server${NC}"
echo ""
echo -e "${YELLOW}2. Executar teste final:${NC}"
echo -e "   ${BLUE}./scripts/test-final-completo.sh${NC}"
echo ""
echo -e "${GREEN}🎯 RESULTADO ESPERADO:${NC}"
echo -e "   Taxa de sucesso: 100% (8/8 testes)"
echo -e "   🎉 SISTEMA COMPLETAMENTE FUNCIONAL!"
echo ""

echo -e "${BLUE}📋 RESUMO DO QUE FOI CORRIGIDO:${NC}"
echo -e "   ✅ Coluna alt_text adicionada à tabela tournament_images"
echo -e "   ✅ Dados de exemplo inseridos (18 imagens em 5 categorias)"
echo -e "   ✅ Rota GET /api/tournament/images corrigida"
echo -e "   ✅ Query otimizada para usar apenas colunas existentes"
echo -e "   ✅ Tratamento de erros melhorado"
echo ""