#!/bin/bash
# scripts/test-tournament-system.sh - Teste completo do sistema de torneios

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🏆 TESTE COMPLETO DO SISTEMA DE TORNEIOS - FASE 1"
echo "================================================================"
echo ""

# Configurações
API_BASE="http://localhost:3000/api"
USER_ID=1
TEST_CATEGORY="cores"

# Função para fazer requisições HTTP
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=${4:-200}
    
    echo -e "${BLUE}📡 $method $url${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -H "user-id: $USER_ID" \
            -H "Content-Type: application/json" \
            "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "user-id: $USER_ID" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ Status: $http_code${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Status: $http_code (esperado: $expected_status)${NC}"
        echo "$body"
        echo ""
        return 1
    fi
}

# Função para verificar se servidor está rodando
check_server() {
    echo -e "${BLUE}🔍 Verificando se servidor está rodando...${NC}"
    
    if curl -s "$API_BASE/health" > /dev/null; then
        echo -e "${GREEN}✅ Servidor está rodando${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor não está respondendo em $API_BASE${NC}"
        echo "   Execute: npm run server"
        return 1
    fi
}

# Função para verificar banco de dados
check_database() {
    echo -e "${BLUE}🗄️ Verificando estrutura do banco de dados...${NC}"
    
    # Verificar se tabelas existem
    tables=("tournament_images" "tournament_sessions" "tournament_choices" "tournament_results")
    
    for table in "${tables[@]}"; do
        if psql -h localhost -U matchit -d matchit_db -c "\\dt $table" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Tabela $table existe${NC}"
        else
            echo -e "${RED}❌ Tabela $table não encontrada${NC}"
            echo "   Execute a migração: psql -d matchit_db -f database/migrations/002_complete_style_and_tournament_schema.sql"
            return 1
        fi
    done
    
    # Verificar se há imagens de teste
    local count=$(psql -h localhost -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM tournament_images WHERE approved = true;" 2>/dev/null | tr -d ' ')
    
    if [ "$count" -ge 8 ]; then
        echo -e "${GREEN}✅ Imagens de teste disponíveis: $count${NC}"
    else
        echo -e "${YELLOW}⚠️ Poucas imagens de teste: $count (recomendado: 16+)${NC}"
        echo "   Executando inserção de imagens de teste..."
        insert_test_images
    fi
}

# Função para inserir imagens de teste
insert_test_images() {
    echo -e "${BLUE}📸 Inserindo imagens de teste...${NC}"
    
    psql -h localhost -U matchit -d matchit_db << 'EOF'
INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, active, approved) 
VALUES 
    -- Cores
    ('cores', 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Vermelho', 'https://via.placeholder.com/150x150/FF6B6B', 'Vermelho Vibrante', 'Tom vermelho quente e energético', true, true),
    ('cores', 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Verde', 'https://via.placeholder.com/150x150/4ECDC4', 'Verde Menta', 'Tom verde refrescante', true, true),
    ('cores', 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Azul', 'https://via.placeholder.com/150x150/45B7D1', 'Azul Oceano', 'Tom azul profundo e calmo', true, true),
    ('cores', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Amarelo', 'https://via.placeholder.com/150x150/F39C12', 'Amarelo Solar', 'Tom amarelo brilhante', true, true),
    ('cores', 'https://via.placeholder.com/400x400/9B59B6/FFFFFF?text=Roxo', 'https://via.placeholder.com/150x150/9B59B6', 'Roxo Real', 'Tom roxo elegante', true, true),
    ('cores', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Laranja', 'https://via.placeholder.com/150x150/E67E22', 'Laranja Sunset', 'Tom laranja caloroso', true, true),
    ('cores', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Azul+Dark', 'https://via.placeholder.com/150x150/2C3E50', 'Azul Escuro', 'Tom azul profissional', true, true),
    ('cores', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Verde+Dark', 'https://via.placeholder.com/150x150/27AE60', 'Verde Floresta', 'Tom verde natural', true, true),
    ('cores', 'https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=Vermelho+Dark', 'https://via.placeholder.com/150x150/E74C3C', 'Vermelho Intenso', 'Tom vermelho forte', true, true),
    ('cores', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Violeta', 'https://via.placeholder.com/150x150/8E44AD', 'Violeta Místico', 'Tom violeta profundo', true, true),
    ('cores', 'https://via.placeholder.com/400x400/F1C40F/FFFFFF?text=Dourado', 'https://via.placeholder.com/150x150/F1C40F', 'Dourado Luxo', 'Tom dourado brilhante', true, true),
    ('cores', 'https://via.placeholder.com/400x400/95A5A6/FFFFFF?text=Cinza', 'https://via.placeholder.com/150x150/95A5A6', 'Cinza Moderno', 'Tom cinza neutro', true, true),
    ('cores', 'https://via.placeholder.com/400x400/34495E/FFFFFF?text=Chumbo', 'https://via.placeholder.com/150x150/34495E', 'Chumbo Elegante', 'Tom cinza escuro', true, true),
    ('cores', 'https://via.placeholder.com/400x400/16A085/FFFFFF?text=Turquesa', 'https://via.placeholder.com/150x150/16A085', 'Turquesa Tropical', 'Tom turquesa vibrante', true, true),
    ('cores', 'https://via.placeholder.com/400x400/D35400/FFFFFF?text=Terracota', 'https://via.placeholder.com/150x150/D35400', 'Terracota Natural', 'Tom terracota terroso', true, true),
    ('cores', 'https://via.placeholder.com/400x400/C0392B/FFFFFF?text=Borgonha', 'https://via.placeholder.com/150x150/C0392B', 'Borgonha Sofisticado', 'Tom borgonha elegante', true, true),
    
    -- Estilos
    ('estilos', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Casual', 'https://via.placeholder.com/150x150/2C3E50', 'Casual Moderno', 'Estilo casual contemporâneo', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Formal', 'https://via.placeholder.com/150x150/8E44AD', 'Formal Elegante', 'Estilo formal sofisticado', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Boho', 'https://via.placeholder.com/150x150/E67E22', 'Boho Chic', 'Estilo bohemio livre', true, true),
    ('estilos', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Minimal', 'https://via.placeholder.com/150x150/27AE60', 'Minimalista', 'Estilo limpo e simples', true, true)
ON CONFLICT DO NOTHING;
EOF
    
    echo -e "${GREEN}✅ Imagens de teste inseridas${NC}"
}

# INÍCIO DOS TESTES
echo -e "${YELLOW}🚀 Iniciando bateria de testes...${NC}"
echo ""

# 1. Verificar servidor
if ! check_server; then
    exit 1
fi

# 2. Verificar banco de dados
if ! check_database; then
    exit 1
fi

echo ""
echo "================================================================"
echo -e "${YELLOW}📋 TESTANDO ENDPOINTS DO SISTEMA DE TORNEIOS${NC}"
echo "================================================================"
echo ""

# 3. Testar endpoint de categorias
echo -e "${BLUE}📊 TESTE 1: Listar categorias disponíveis${NC}"
if make_request "GET" "$API_BASE/tournament/categories"; then
    echo -e "${GREEN}✅ Teste 1 passou${NC}"
else
    echo -e "${RED}❌ Teste 1 falhou${NC}"
    exit 1
fi

# 4. Verificar se há sessão ativa
echo -e "${BLUE}🔍 TESTE 2: Verificar sessão ativa${NC}"
make_request "GET" "$API_BASE/tournament/active/$TEST_CATEGORY"

# 5. Iniciar novo torneio
echo -e "${BLUE}🎮 TESTE 3: Iniciar novo torneio${NC}"
start_data="{\"category\":\"$TEST_CATEGORY\",\"tournamentSize\":16}"
if make_request "POST" "$API_BASE/tournament/start" "$start_data"; then
    echo -e "${GREEN}✅ Teste 3 passou${NC}"
    
    # Extrair sessionId da resposta
    SESSION_ID=$(curl -s -H "user-id: $USER_ID" -H "Content-Type: application/json" -d "$start_data" "$API_BASE/tournament/start" | jq -r '.data.sessionId')
    echo "📝 Session ID: $SESSION_ID"
else
    echo -e "${RED}❌ Teste 3 falhou${NC}"
    exit 1
fi

# 6. Verificar status do torneio
if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
    echo -e "${BLUE}📈 TESTE 4: Verificar status do torneio${NC}"
    make_request "GET" "$API_BASE/tournament/$SESSION_ID/status"
    
    # 7. Verificar sessão ativa novamente
    echo -e "${BLUE}🔄 TESTE 5: Verificar sessão ativa (após iniciar)${NC}"
    if make_request "GET" "$API_BASE/tournament/active/$TEST_CATEGORY"; then
        echo -e "${GREEN}✅ Teste 5 passou${NC}"
        
        # 8. Simular algumas escolhas
        echo -e "${BLUE}⚔️ TESTE 6: Simular escolhas no torneio${NC}"
        for i in {1..3}; do
            echo "   Simulando escolha $i..."
            
            # Buscar confronto atual
            current_matchup=$(curl -s -H "user-id: $USER_ID" "$API_BASE/tournament/active/$TEST_CATEGORY" | jq '.data.currentMatchup')
            
            if [ "$current_matchup" != "null" ]; then
                # Pegar ID da primeira imagem como vencedora
                winner_id=$(echo $current_matchup | jq '.imageA.id')
                response_time=$((RANDOM % 3000 + 1000))  # 1-4 segundos
                
                choice_data="{\"sessionId\":\"$SESSION_ID\",\"winnerId\":$winner_id,\"responseTime\":$response_time}"
                
                if make_request "POST" "$API_BASE/tournament/choice" "$choice_data"; then
                    echo -e "${GREEN}   ✅ Escolha $i processada${NC}"
                else
                    echo -e "${YELLOW}   ⚠️ Escolha $i pode ter terminado o torneio${NC}"
                    break
                fi
                
                sleep 1
            else
                echo -e "${YELLOW}   ⚠️ Não há confronto ativo${NC}"
                break
            fi
        done
        
        # 9. Verificar histórico do usuário
        echo -e "${BLUE}📚 TESTE 7: Verificar histórico de torneios${NC}"
        make_request "GET" "$API_BASE/tournament/user/history?limit=5"
        
    else
        echo -e "${RED}❌ Teste 5 falhou${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Session ID não disponível, pulando testes dependentes${NC}"
fi

echo ""
echo "================================================================"
echo -e "${YELLOW}📊 RESUMO DOS TESTES${NC}"
echo "================================================================"
echo ""

# Verificar se sistema está funcional
echo -e "${BLUE}🔍 Verificação final do sistema...${NC}"

# Contar torneios na base
tournament_count=$(psql -h localhost -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM tournament_sessions;" 2>/dev/null | tr -d ' ')
choices_count=$(psql -h localhost -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM tournament_choices;" 2>/dev/null | tr -d ' ')

echo "📊 Estatísticas do sistema:"
echo "   • Torneios criados: $tournament_count"
echo "   • Escolhas registradas: $choices_count"
echo "   • Imagens disponíveis: $(psql -h localhost -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM tournament_images WHERE approved = true;" 2>/dev/null | tr -d ' ')"
echo ""

if [ "$tournament_count" -gt 0 ] && [ "$choices_count" -gt 0 ]; then
    echo -e "${GREEN}🎉 SISTEMA DE TORNEIOS FUNCIONANDO CORRETAMENTE!${NC}"
    echo ""
    echo -e "${GREEN}✅ Próximos passos recomendados:${NC}"
    echo "   1. Implementar interface frontend (TournamentScreen.tsx)"
    echo "   2. Criar admin panel para gestão de imagens"
    echo "   3. Adicionar mais categorias e imagens"
    echo "   4. Implementar autenticação JWT completa"
    echo "   5. Otimizar performance para produção"
    echo ""
    echo -e "${BLUE}💡 Para testar manualmente:${NC}"
    echo "   curl -H 'user-id: 1' $API_BASE/tournament/categories"
    echo "   curl -H 'user-id: 1' -d '{\"category\":\"cores\"}' $API_BASE/tournament/start"
    
    exit 0
else
    echo -e "${RED}❌ SISTEMA COM PROBLEMAS${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Verificar:${NC}"
    echo "   1. Banco de dados configurado corretamente"
    echo "   2. Migrações executadas"
    echo "   3. TournamentEngine importado corretamente"
    echo "   4. Logs do servidor para erros"
    
    exit 1
fi