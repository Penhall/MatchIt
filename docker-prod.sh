#!/bin/bash
# docker-prod.sh - Ambiente de produção

echo "🚀 Iniciando ambiente de produção MatchIt..."
docker compose up -d --build

echo "📊 Status dos serviços:"
docker compose ps

echo "📝 Para acompanhar logs:"
echo "  docker compose logs -f backend"
echo "  docker compose logs -f nginx"
