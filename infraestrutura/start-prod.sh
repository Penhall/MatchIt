#\!/bin/bash
# start-prod.sh - Iniciar MatchIt em modo produção
set -e

echo "🚀 INICIANDO MATCHIT - MODO PRODUÇÃO"
echo "===================================="
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
echo "   • Frontend Nginx (porta 80)"
echo ""

# Parar containers existentes
echo "🔄 Parando containers existentes..."
docker-compose -f docker-compose-fixed.yml down

echo "🔨 Construindo e iniciando containers..."
docker-compose -f docker-compose-fixed.yml --profile prod up --build -d

echo ""
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 20

echo ""
echo "📊 Status dos serviços:"
docker-compose -f docker-compose-fixed.yml ps

echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://localhost"
echo "   API:      http://localhost:3000/api/health"
echo "   Database: localhost:5432 (user: matchit, password: matchit123)"
echo ""
echo "📝 Para acompanhar logs:"
echo "   docker-compose -f docker-compose-fixed.yml logs -f backend"
echo "   docker-compose -f docker-compose-fixed.yml logs -f frontend"
echo ""
echo "🔄 Para parar:"
echo "   docker-compose -f docker-compose-fixed.yml down"
echo ""
echo "✅ MatchIt iniciado com sucesso em modo produção\!"
