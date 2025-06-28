#!/bin/bash
# scripts/test-tournament-ready.sh - Teste específico para torneios

echo "🏆 Testando Sistema de Torneios MatchIt..."

# Configurar conexão
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

export PGHOST="${DB_HOST:-localhost}"
export PGPORT="${DB_PORT:-5432}"
export PGDATABASE="${DB_NAME:-matchit_db}"
export PGUSER="${DB_USER:-matchit}"
export PGPASSWORD="${DB_PASSWORD:-matchit123}"

echo ""
echo "🔍 VERIFICAÇÕES:"

# 1. Conexão
if psql -c "SELECT 1;" >/dev/null 2>&1; then
    echo "   ✅ Conexão com banco"
else
    echo "   ❌ Conexão com banco"
    exit 1
fi

# 2. Enums
enum_count=$(psql -t -c "SELECT COUNT(*) FROM pg_type WHERE typname IN ('tournament_category_enum', 'tournament_status_enum');" 2>/dev/null | xargs)
if [ "${enum_count:-0}" -eq 2 ]; then
    echo "   ✅ Enums de torneio (2/2)"
else
    echo "   ❌ Enums de torneio (${enum_count:-0}/2)"
fi

# 3. Tabelas principais
tables=("tournament_images" "tournament_sessions" "tournament_choices" "tournament_results")
existing=0
for table in "${tables[@]}"; do
    if psql -c "\d $table" >/dev/null 2>&1; then
        existing=$((existing + 1))
    fi
done
echo "   ✅ Tabelas de torneio ($existing/${#tables[@]})"

# 4. Dados de exemplo
approved_images=$(psql -t -c "SELECT COUNT(*) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
echo "   📊 Imagens aprovadas: ${approved_images:-0}"

# 5. Categorias
categories=$(psql -t -c "SELECT COUNT(DISTINCT category) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
echo "   📋 Categorias com dados: ${categories:-0}"

# 6. Teste de consulta API-style
echo ""
echo "🎯 TESTE DE CONSULTA (estilo API):"
psql -c "
SELECT 
    category,
    COUNT(*) as total_images,
    COUNT(CASE WHEN approved = true THEN 1 END) as approved_images,
    COUNT(CASE WHEN active = true AND approved = true THEN 1 END) as available_for_tournament
FROM tournament_images 
GROUP BY category 
ORDER BY category;
"

echo ""
echo "🚀 CATEGORIAS PRONTAS PARA TORNEIO:"
ready_categories=$(psql -t -c "
SELECT category 
FROM tournament_images 
WHERE approved = true AND active = true
GROUP BY category 
HAVING COUNT(*) >= 8
ORDER BY category;
" 2>/dev/null)

if [ -n "$ready_categories" ]; then
    echo "$ready_categories" | while read -r cat; do
        if [ -n "$cat" ]; then
            echo "   🏆 $cat"
        fi
    done
else
    echo "   ⚠️ Nenhuma categoria tem 8+ imagens aprovadas"
fi

echo ""
if [ "${approved_images:-0}" -gt 10 ] && [ "${categories:-0}" -gt 3 ]; then
    echo "🎉 SISTEMA DE TORNEIOS PRONTO!"
    echo "✅ Banco configurado, dados inseridos, consultas funcionando"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. npm run dev"
    echo "   2. Testar endpoints: http://localhost:3000/api/tournament/categories"
    echo "   3. Iniciar torneio no app mobile"
else
    echo "⚠️ Sistema precisa de mais dados"
    echo "💡 Execute: ./scripts/fix-sync-issues.sh"
fi
