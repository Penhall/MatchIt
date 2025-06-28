#!/bin/bash
# scripts/verify-database.sh - Verificação do banco de dados

echo "🔍 Verificando estado do banco de dados MatchIt..."

DB_NAME="${DB_NAME:-matchit_tournaments}"

echo "📊 Estatísticas das tabelas:"
psql -d "$DB_NAME" -c "
    SELECT 
        'Users' as tabela, COUNT(*) as registros FROM users
    UNION ALL
    SELECT 
        'Imagens de Torneio', COUNT(*) FROM tournament_images  
    UNION ALL
    SELECT 
        'Sessões de Torneio', COUNT(*) FROM tournament_sessions
    UNION ALL
    SELECT 
        'Escolhas de Torneio', COUNT(*) FROM tournament_choices
    UNION ALL
    SELECT 
        'Resultados de Torneio', COUNT(*) FROM tournament_results
    UNION ALL
    SELECT 
        'Preferências de Estilo', COUNT(*) FROM style_choices;
"

echo ""
echo "🎯 Imagens por categoria:"
psql -d "$DB_NAME" -c "
    SELECT 
        category,
        COUNT(*) as total,
        COUNT(CASE WHEN approved = true THEN 1 END) as aprovadas,
        COUNT(CASE WHEN active = true THEN 1 END) as ativas
    FROM tournament_images 
    GROUP BY category 
    ORDER BY category;
"

echo ""
echo "🔧 Verificação de integridade:"
psql -d "$DB_NAME" -c "
    SELECT 
        CASE 
            WHEN COUNT(*) >= 8 THEN '✅ Suficientes para torneios'
            ELSE '⚠️  Insuficientes (' || COUNT(*) || ')'
        END as status_imagens
    FROM tournament_images 
    WHERE approved = true AND active = true;
"

echo ""
echo "✅ Verificação concluída!"
