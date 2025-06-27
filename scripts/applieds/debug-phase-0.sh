#!/bin/bash
# debug-phase-0.sh - Debug dos problemas da Fase 0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================================"
echo " DEBUG FASE 0 - IDENTIFICANDO PROBLEMAS"
echo "================================================================"
echo -e "${NC}"

echo -e "${BLUE}🔍 1. Verificando se servidor está rodando...${NC}"
SERVER_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "ERRO")

if [[ $SERVER_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Servidor está rodando${NC}"
else
    echo -e "${RED}❌ Servidor não está respondendo${NC}"
    echo "Execute: npm run server"
    exit 1
fi

echo -e "${BLUE}🔍 2. Verificando PostgreSQL...${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"
else
    echo -e "${RED}❌ PostgreSQL não está rodando${NC}"
    echo "Inicie o PostgreSQL e tente novamente"
    exit 1
fi

echo -e "${BLUE}🔍 3. Testando conexão com banco...${NC}"
DB_TEST=$(PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "SELECT NOW();" 2>&1)

if [[ $DB_TEST == *"ERROR"* ]] || [[ $DB_TEST == *"FATAL"* ]]; then
    echo -e "${RED}❌ Erro na conexão com banco:${NC}"
    echo "$DB_TEST"
else
    echo -e "${GREEN}✅ Conexão com banco OK${NC}"
fi

echo -e "${BLUE}🔍 4. Verificando se tabela style_preferences existe...${NC}"
TABLE_CHECK=$(PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "\\dt style_preferences" 2>&1)

if [[ $TABLE_CHECK == *"style_preferences"* ]]; then
    echo -e "${GREEN}✅ Tabela style_preferences existe${NC}"
    
    # Contar registros
    RECORD_COUNT=$(PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM style_preferences;" 2>/dev/null | xargs)
    echo -e "${BLUE}📊 Registros na tabela: $RECORD_COUNT${NC}"
else
    echo -e "${RED}❌ Tabela style_preferences não existe${NC}"
    echo "Execute a migração: PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -f database/migrations/002_complete_style_and_tournament_schema.sql"
fi

echo -e "${BLUE}🔍 5. Testando endpoint style-preferences diretamente...${NC}"
ENDPOINT_TEST=$(curl -s -w "%{http_code}" http://localhost:3000/api/profile/style-preferences -o /tmp/response.json)

echo -e "${BLUE}Status Code: $ENDPOINT_TEST${NC}"
echo -e "${BLUE}Response:${NC}"
cat /tmp/response.json
echo ""

if [ "$ENDPOINT_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint responde com 200${NC}"
else
    echo -e "${RED}❌ Endpoint retorna erro $ENDPOINT_TEST${NC}"
fi

echo -e "${BLUE}🔍 6. Verificando logs do servidor...${NC}"
if [ -f "logs/app.log" ]; then
    echo -e "${BLUE}Últimas 10 linhas do log:${NC}"
    tail -10 logs/app.log
else
    echo -e "${YELLOW}⚠️  Arquivo de log não encontrado${NC}"
fi

echo -e "${BLUE}🔍 7. Verificando se arquivos foram atualizados...${NC}"

# Verificar se o novo service existe
if [ -f "server/services/StylePreferencesService.js" ]; then
    echo -e "${GREEN}✅ StylePreferencesService.js existe${NC}"
else
    echo -e "${RED}❌ StylePreferencesService.js não encontrado${NC}"
fi

# Verificar se database config existe
if [ -f "server/config/database.js" ]; then
    echo -e "${GREEN}✅ database.js existe${NC}"
else
    echo -e "${RED}❌ database.js não encontrado${NC}"
fi

# Verificar se rotas foram atualizadas (procurar por StylePreferencesService)
if grep -q "StylePreferencesService" server/routes/profile.js 2>/dev/null; then
    echo -e "${GREEN}✅ Rotas atualizadas com StylePreferencesService${NC}"
else
    echo -e "${RED}❌ Rotas não foram atualizadas${NC}"
fi

echo -e "${BLUE}🔍 8. Testando import do database manualmente...${NC}"

# Criar script de teste de conexão
cat > /tmp/test-db.mjs << 'EOF'
import { testConnection } from './server/config/database.js';

async function test() {
    try {
        console.log('Testando conexão...');
        const result = await testConnection();
        console.log('Resultado:', result);
        process.exit(result ? 0 : 1);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

test();
EOF

echo -e "${BLUE}Executando teste de conexão...${NC}"
if node /tmp/test-db.mjs; then
    echo -e "${GREEN}✅ Import e conexão funcionam${NC}"
else
    echo -e "${RED}❌ Problema no import ou conexão${NC}"
fi

rm -f /tmp/test-db.mjs /tmp/response.json

echo ""
echo -e "${BLUE}================================================================"
echo " DIAGNÓSTICO CONCLUÍDO"
echo "================================================================${NC}"

echo -e "${YELLOW}💡 Próximos passos baseados nos resultados acima:${NC}"
echo "1. Se tabela não existe: Execute a migração"
echo "2. Se conexão falha: Verifique credenciais do PostgreSQL"
echo "3. Se arquivos não existem: Execute novamente o script complete-phase-0.sh"
echo "4. Se imports falham: Verifique sintaxe ES Modules"
echo "5. Se endpoint falha: Reinicie o servidor para carregar novos arquivos"

echo ""
echo -e "${GREEN}Para corrigir problemas comuns, execute:${NC}"
echo "• Reiniciar servidor: Ctrl+C no terminal do servidor, depois npm run server"
echo "• Re-executar migração: PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -f database/migrations/002_complete_style_and_tournament_schema.sql"
echo "• Verificar logs: cat logs/app.log"
