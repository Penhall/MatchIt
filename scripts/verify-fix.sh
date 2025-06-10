#!/bin/bash
# verify-fix.sh - Script de Verificação MatchIt
# Executa testes para verificar se as correções funcionaram

echo "🔍 MatchIt - Verificação Pós-Correção"
echo "====================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 - OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - FALHOU${NC}"
        return 1
    fi
}

echo ""
echo -e "${BLUE}🐳 1. Verificando containers Docker...${NC}"

# Verificar se docker-compose está funcionando
docker-compose --version > /dev/null 2>&1
check_status "Docker Compose instalado"

# Verificar containers em execução
CONTAINERS=$(docker-compose ps --quiet)
if [ ! -z "$CONTAINERS" ]; then
    echo -e "${GREEN}✅ Containers em execução:${NC}"
    docker-compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ Nenhum container em execução${NC}"
    echo -e "${YELLOW}💡 Execute: docker-compose up --build${NC}"
fi

echo ""
echo -e "${BLUE}🔌 2. Verificando conectividade...${NC}"

# Verificar se porta 3000 está acessível
timeout 5 bash -c "</dev/tcp/localhost/3000" > /dev/null 2>&1
check_status "Porta 3000 acessível"

# Verificar se porta 80 está acessível (frontend)
timeout 5 bash -c "</dev/tcp/localhost/80" > /dev/null 2>&1
check_status "Porta 80 acessível (Frontend)"

echo ""
echo -e "${BLUE}🏥 3. Testando Health Check...${NC}"

# Health check do backend
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/health -o /tmp/health.json 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Health Check - OK${NC}"
    
    # Exibir informações de saúde
    if [ -f /tmp/health.json ]; then
        STATUS=$(jq -r '.status // "unknown"' /tmp/health.json 2>/dev/null)
        DB_STATUS=$(jq -r '.database.status // "unknown"' /tmp/health.json 2>/dev/null)
        UPTIME=$(jq -r '.uptime // "unknown"' /tmp/health.json 2>/dev/null)
        
        echo -e "   ${GREEN}📊 Status: $STATUS${NC}"
        echo -e "   ${GREEN}🔌 Database: $DB_STATUS${NC}"
        echo -e "   ${GREEN}⏱️ Uptime: $UPTIME${NC}"
    fi
else
    echo -e "${RED}❌ Health Check - FALHOU (HTTP: $HEALTH_RESPONSE)${NC}"
fi

echo ""
echo -e "${BLUE}📡 4. Testando endpoints da API...${NC}"

# Testar endpoint de info
INFO_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/info -o /tmp/info.json 2>/dev/null || echo "000")

if [ "$INFO_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API Info - OK${NC}"
    
    if [ -f /tmp/info.json ]; then
        API_NAME=$(jq -r '.name // "unknown"' /tmp/info.json 2>/dev/null)
        API_VERSION=$(jq -r '.version // "unknown"' /tmp/info.json 2>/dev/null)
        API_ENV=$(jq -r '.environment // "unknown"' /tmp/info.json 2>/dev/null)
        
        echo -e "   ${GREEN}📦 API: $API_NAME v$API_VERSION${NC}"
        echo -e "   ${GREEN}🌍 Environment: $API_ENV${NC}"
    fi
else
    echo -e "${RED}❌ API Info - FALHOU (HTTP: $INFO_RESPONSE)${NC}"
fi

echo ""
echo -e "${BLUE}🗄️ 5. Verificando banco de dados...${NC}"

# Verificar se PostgreSQL está acessível
PG_CHECK=$(docker-compose exec -T postgres pg_isready -U matchit 2>/dev/null)
if [[ $PG_CHECK == *"accepting connections"* ]]; then
    echo -e "${GREEN}✅ PostgreSQL - OK${NC}"
    
    # Verificar tabelas principais
    TABLES=$(docker-compose exec -T postgres psql -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ "$TABLES" -gt 0 ]; then
        echo -e "   ${GREEN}📊 Tabelas encontradas: $TABLES${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Nenhuma tabela encontrada (normal se for primeira execução)${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL - FALHOU${NC}"
fi

echo ""
echo -e "${BLUE}🌐 6. Verificando frontend...${NC}"

# Verificar se frontend está acessível
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" http://localhost -o /dev/null 2>/dev/null || echo "000")

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend - OK${NC}"
    echo -e "   ${GREEN}🔗 Acesse: http://localhost${NC}"
else
    echo -e "${RED}❌ Frontend - FALHOU (HTTP: $FRONTEND_RESPONSE)${NC}"
fi

echo ""
echo -e "${BLUE}📝 7. Verificando logs recentes...${NC}"

# Verificar se há erros nos logs
ERROR_COUNT=$(docker-compose logs backend --tail=50 2>/dev/null | grep -i error | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ Sem erros nos logs recentes${NC}"
else
    echo -e "${YELLOW}⚠️ $ERROR_COUNT erros encontrados nos logs${NC}"
    echo -e "${YELLOW}💡 Execute: docker-compose logs backend | grep -i error${NC}"
fi

echo ""
echo -e "${BLUE}📊 RESUMO FINAL${NC}"
echo "============="

# URLs de acesso
echo -e "${GREEN}🌐 URLs de Acesso:${NC}"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3000/api"
echo "   Health Check: http://localhost:3000/api/health"
echo "   API Info: http://localhost:3000/api/info"

echo ""
echo -e "${GREEN}🛠️ Comandos Úteis:${NC}"
echo "   Ver logs: docker-compose logs -f backend"
echo "   Restart: docker-compose restart backend"
echo "   Rebuild: docker-compose up --build"
echo "   Parar: docker-compose down"

echo ""
if [ "$HEALTH_RESPONSE" = "200" ] && [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}🎉 VERIFICAÇÃO CONCLUÍDA - SISTEMA FUNCIONANDO!${NC}"
else
    echo -e "${YELLOW}⚠️ VERIFICAÇÃO CONCLUÍDA - ALGUNS PROBLEMAS ENCONTRADOS${NC}"
    echo -e "${YELLOW}💡 Consulte as instruções acima para resolver${NC}"
fi

# Limpeza
rm -f /tmp/health.json /tmp/info.json

echo ""