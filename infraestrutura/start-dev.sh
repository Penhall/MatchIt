#\!/bin/bash
# start-dev.sh - Iniciar MatchIt em modo desenvolvimento
set -e

echo "🚀 INICIANDO MATCHIT - MODO DESENVOLVIMENTO"
echo "=========================================="
echo ""

# Verificar se Docker está rodando
if \! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker Desktop primeiro."
    exit 1
fi

echo "📋 Serviços que serão iniciados:"
echo "   • PostgreSQL (porta 5432)"
echo "   • Redis (porta 6379)"
echo "   • Backend API (porta 3000)"
echo "   • Frontend Vite (porta 5173)"
echo ""

# Parar containers existentes
echo "🔄 Parando containers existentes..."
docker-compose -f docker-compose-fixed.yml down

# Remover volumes órfãos se necessário
echo "🧹 Limpando volumes órfãos..."
docker volume prune -f

echo "🔨 Construindo e iniciando containers..."
docker-compose -f docker-compose-fixed.yml --profile dev up --build -d

echo ""
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

echo ""
echo "📊 Status dos serviços:"
docker-compose -f docker-compose-fixed.yml ps

echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000/api/health"
echo "   Database: localhost:5432 (user: matchit, password: matchit123)"
echo "   Redis:    localhost:6379"
echo ""
echo "📝 Para acompanhar logs:"
echo "   docker-compose -f docker-compose-fixed.yml logs -f backend"
echo "   docker-compose -f docker-compose-fixed.yml logs -f frontend-dev"
echo ""
echo "🔄 Para parar:"
echo "   docker-compose -f docker-compose-fixed.yml down"
echo ""
echo "✅ MatchIt iniciado com sucesso em modo desenvolvimento\!"
