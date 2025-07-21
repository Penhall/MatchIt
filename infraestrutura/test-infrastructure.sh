#\!/bin/bash
# test-infrastructure.sh - Testar infraestrutura MatchIt
set -e

echo "🧪 TESTANDO INFRAESTRUTURA MATCHIT"
echo "=================================="
echo ""

# Função para testar URL
test_url() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    if curl -s --max-time $timeout "$url" > /dev/null; then
        echo "✅ $name - OK"
        return 0
    else
        echo "❌ $name - FALHOU"
        return 1
    fi
}

# Verificar se containers estão rodando
echo "📋 Verificando containers..."
if docker-compose -f docker-compose-fixed.yml ps  < /dev/null |  grep -q "Up"; then
    echo "✅ Containers estão rodando"
else
    echo "❌ Nenhum container está rodando"
    echo "💡 Execute: ./start-dev.sh ou ./start-prod.sh"
    exit 1
fi

echo ""
echo "🔍 Testando conectividade..."

# Testar serviços
test_url "http://localhost:3000/api/health" "Backend API"
test_url "http://localhost:5173" "Frontend Dev" 5 || echo "⚠️  Frontend Dev não está rodando (normal em modo prod)"
test_url "http://localhost:80" "Frontend Prod" 5 || echo "⚠️  Frontend Prod não está rodando (normal em modo dev)"

echo ""
echo "🗄️  Testando banco de dados..."
if docker-compose -f docker-compose-fixed.yml exec -T postgres pg_isready -U matchit -d matchit_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL - OK"
else
    echo "❌ PostgreSQL - FALHOU"
fi

echo ""
echo "🚀 Testando Redis..."
if docker-compose -f docker-compose-fixed.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis - OK"
else
    echo "❌ Redis - FALHOU"
fi

echo ""
echo "📊 Status detalhado dos containers:"
docker-compose -f docker-compose-fixed.yml ps

echo ""
echo "📈 Uso de recursos:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🎯 Teste concluído\!"
