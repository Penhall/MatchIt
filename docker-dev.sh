#!/bin/bash
# docker-dev.sh - Ambiente de desenvolvimento

echo "🚀 Iniciando ambiente de desenvolvimento MatchIt..."
docker compose --profile dev up --build -d

echo "📊 Status dos serviços:"
docker compose ps

echo "📝 Para acompanhar logs:"
echo "  docker compose logs -f dev-backend"
echo "  docker compose logs -f postgres"
