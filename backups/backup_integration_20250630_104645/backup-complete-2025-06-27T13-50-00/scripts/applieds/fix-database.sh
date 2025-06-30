#!/bin/bash
# scripts/fix-database.sh - Script para Corrigir Problemas do Banco de Dados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações do banco
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-matchit_db}
DB_USER=${DB_USER:-matchit}
DB_PASSWORD=${DB_PASSWORD:-matchit123}

echo -e "${BLUE}🔧 Correção do Banco de Dados MatchIt${NC}"
echo "====================================="

# Função para executar SQL
run_sql() {
    local sql="$1"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$sql"
}

# Função para executar arquivo SQL
run_sql_file() {
    local file="$1"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file"
}

# 1. Verificar estado atual
echo -e "${BLUE}📊 Verificando estado atual do banco...${NC}"

echo "Tabelas existentes:"
run_sql "\dt emotional*" || echo "Nenhuma tabela emocional encontrada"

echo -e "\n${BLUE}🧹 Limpando problemas conhecidos...${NC}"

# 2. Remover objetos problemáticos
echo "Removendo views problemáticas..."
run_sql "DROP VIEW IF EXISTS active_emotional_profiles CASCADE;" || true

echo "Removendo funções problemáticas..."
run_sql "DROP FUNCTION IF EXISTS calculate_profile_quality_score(VARCHAR) CASCADE;" || true
run_sql "DROP FUNCTION IF EXISTS find_emotionally_compatible_users(UUID, INTEGER, INTEGER) CASCADE;" || true

echo "Removendo triggers problemáticos..."
run_sql "DROP TRIGGER IF EXISTS trigger_emotional_profiles_updated_at ON emotional_profiles CASCADE;" || true
run_sql "DROP FUNCTION IF EXISTS update_emotional_profile_updated_at() CASCADE;" || true

echo "Removendo índices problemáticos..."
run_sql "DROP INDEX IF EXISTS idx_emotional_profiles_user_id CASCADE;" || true
run_sql "DROP INDEX IF EXISTS idx_emotional_profiles_active CASCADE;" || true
run_sql "DROP INDEX IF EXISTS idx_emotional_profiles_public CASCADE;" || true
run_sql "DROP INDEX IF EXISTS idx_emotional_profiles_update_due CASCADE;" || true

# 3. Remover tabela principal se existir mas estiver corrompida
echo -e "\n${BLUE}🗑️ Verificando tabela emotional_profiles...${NC}"
TABLE_EXISTS=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'emotional_profiles';" | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$TABLE_EXISTS" = "0" ]; then
    echo -e "${YELLOW}⚠️ Tabela emotional_profiles não existe - será criada${NC}"
else
    echo -e "${YELLOW}⚠️ Tabela emotional_profiles existe mas pode estar corrompida - recriando...${NC}"
    run_sql "DROP TABLE IF EXISTS emotional_profiles CASCADE;" || true
fi

# 4. Executar migração corrigida
echo -e "\n${BLUE}🔧 Executando migração corrigida...${NC}"

# Verificar se arquivo existe
FIXED_MIGRATION="database/migrations/002_emotional_profile_schema_fixed.sql"
if [ ! -f "$FIXED_MIGRATION" ]; then
    echo -e "${RED}❌ Arquivo de migração corrigida não encontrado: $FIXED_MIGRATION${NC}"
    exit 1
fi

# Executar migração com codificação UTF-8
echo "Executando migração corrigida..."
export PGCLIENTENCODING=UTF8
run_sql_file "$FIXED_MIGRATION"

# 5. Verificar resultado
echo -e "\n${BLUE}✅ Verificando resultado...${NC}"

echo "Tabelas criadas:"
run_sql "\dt emotional*"

echo -e "\nVerificando tabela principal:"
MAIN_TABLE_EXISTS=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'emotional_profiles';" | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$MAIN_TABLE_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ Tabela emotional_profiles criada com sucesso!${NC}"
    
    # Testar inserção
    echo "Testando inserção de dados..."
    run_sql "INSERT INTO emotional_profiles (
        id, user_id, energy_level, social_energy, physical_energy, mental_energy,
        openness, vulnerability, emotional_expression, empathy_level,
        emotional_stability, stress_resilience, self_control, adaptability,
        extroversion, social_confidence, group_orientation, intimacy_comfort,
        achievement_drive, competitiveness, goal_orientation, risk_tolerance,
        attachment_style, communication_style, conflict_style
    ) VALUES (
        'test_profile_123', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
        75, 80, 70, 85, 80, 60, 75, 90, 85, 80, 70, 85,
        75, 80, 70, 80, 85, 60, 90, 65,
        'secure', 'assertive', 'collaborative'
    ) ON CONFLICT (id) DO NOTHING;"
    
    # Verificar inserção
    COUNT=$(run_sql "SELECT COUNT(*) FROM emotional_profiles WHERE id = 'test_profile_123';" | grep -o '[0-9]*' | head -1 || echo "0")
    if [ "$COUNT" = "1" ]; then
        echo -e "${GREEN}✅ Inserção de teste bem-sucedida!${NC}"
        
        # Limpar dados de teste
        run_sql "DELETE FROM emotional_profiles WHERE id = 'test_profile_123';"
    else
        echo -e "${YELLOW}⚠️ Problema na inserção de teste${NC}"
    fi
    
else
    echo -e "${RED}❌ Tabela emotional_profiles ainda não foi criada!${NC}"
    exit 1
fi

# 6. Testar funções
echo -e "\nTestando funções criadas..."
FUNCTION_TEST=$(run_sql "SELECT calculate_profile_quality_score('test');" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "ERRO")

if [ "$FUNCTION_TEST" != "ERRO" ]; then
    echo -e "${GREEN}✅ Funções funcionando corretamente${NC}"
else
    echo -e "${YELLOW}⚠️ Algumas funções podem ter problemas${NC}"
fi

# 7. Verificar configurações
echo -e "\nVerificando configurações do sistema..."
CONFIG_COUNT=$(run_sql "SELECT COUNT(*) FROM system_config WHERE key LIKE 'emotional%';" | grep -o '[0-9]*' | head -1 || echo "0")
echo "Configurações emocionais: $CONFIG_COUNT"

# 8. Relatório final
echo -e "\n${GREEN}🎉 Correção concluída!${NC}"
echo "========================"

echo -e "${BLUE}📊 Status Final:${NC}"
run_sql "SELECT 
    table_name as \"Tabela\",
    CASE 
        WHEN table_name = 'emotional_profiles' THEN '✅ Principal'
        WHEN table_name LIKE 'emotional%' THEN '✅ Auxiliar'
        ELSE '✅ OK'
    END as \"Status\"
FROM information_schema.tables 
WHERE table_name LIKE 'emotional%' OR table_name = 'system_config'
ORDER BY table_name;"

echo -e "\n${BLUE}🔧 Comandos para testar:${NC}"
echo "# Verificar estrutura da tabela principal:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"\\d emotional_profiles\""
echo ""
echo "# Testar função de qualidade:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT calculate_profile_quality_score('test');\""
echo ""
echo "# Verificar configurações:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT * FROM system_config WHERE key LIKE 'emotional%';\""

echo -e "\n${GREEN}✅ Banco de dados corrigido e pronto para uso!${NC}"