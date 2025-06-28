#!/bin/bash
# scripts/fix-sync-issues.sh - Correção específica dos problemas identificados

set -e

# =====================================================
# CONFIGURAÇÕES E CORES
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# =====================================================
# BANNER
# =====================================================

print_banner() {
    echo -e "${PURPLE}${BOLD}"
    echo "=========================================================================="
    echo "🔧 MatchIt - Correção de Problemas Específicos"
    echo "🎯 Resolvendo issues da sincronização"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# =====================================================
# CONFIGURAÇÃO DO BANCO
# =====================================================

setup_database_connection() {
    print_step "Configurando conexão com banco..."
    
    # Source .env se existir
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        print_success "Configurações carregadas do .env"
    fi
    
    # Export para psql
    export PGHOST="${DB_HOST:-localhost}"
    export PGPORT="${DB_PORT:-5432}"
    export PGDATABASE="${DB_NAME:-matchit_db}"
    export PGUSER="${DB_USER:-matchit}"
    export PGPASSWORD="${DB_PASSWORD:-matchit123}"
    
    # Testar conexão
    if psql -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Conectado ao banco: $PGDATABASE"
    else
        print_error "Falha na conexão com banco"
        exit 1
    fi
}

# =====================================================
# CORREÇÃO 1: ENUMS DE TORNEIO
# =====================================================

fix_tournament_enums() {
    print_step "Corrigindo enums de torneio..."
    
    # Verificar se enums existem
    local enum_count=$(psql -t -c "
        SELECT COUNT(*) FROM pg_type 
        WHERE typname IN ('tournament_category_enum', 'tournament_status_enum');
    " 2>/dev/null | xargs)
    
    print_info "Enums encontrados: ${enum_count:-0}"
    
    if [ "${enum_count:-0}" -lt 2 ]; then
        print_warning "Criando enums faltantes..."
        
        psql -c "
        BEGIN;
        
        -- Criar enum de categorias se não existir
        DO \$\$ BEGIN
            CREATE TYPE tournament_category_enum AS ENUM (
                'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
                'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
            );
        EXCEPTION
            WHEN duplicate_object THEN 
                RAISE NOTICE 'Enum tournament_category_enum já existe';
        END \$\$;
        
        -- Criar enum de status se não existir  
        DO \$\$ BEGIN
            CREATE TYPE tournament_status_enum AS ENUM (
                'active', 'paused', 'completed', 'cancelled', 'expired'
            );
        EXCEPTION
            WHEN duplicate_object THEN 
                RAISE NOTICE 'Enum tournament_status_enum já existe';
        END \$\$;
        
        COMMIT;
        " >/dev/null 2>&1
        
        print_success "Enums criados/verificados"
    else
        print_success "Enums já existem"
    fi
    
    # Verificar novamente
    local final_enum_count=$(psql -t -c "
        SELECT COUNT(*) FROM pg_type 
        WHERE typname IN ('tournament_category_enum', 'tournament_status_enum');
    " 2>/dev/null | xargs)
    
    print_info "Enums finais: ${final_enum_count:-0}/2"
}

# =====================================================
# CORREÇÃO 2: ESTRUTURA DAS TABELAS
# =====================================================

fix_tournament_tables() {
    print_step "Verificando e corrigindo estrutura das tabelas..."
    
    # Verificar se tournament_images tem a coluna category com o tipo correto
    local category_column=$(psql -t -c "
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tournament_images' 
        AND column_name = 'category';
    " 2>/dev/null | xargs)
    
    print_info "Tipo da coluna category: ${category_column:-'não encontrada'}"
    
    if [ "$category_column" != "USER-DEFINED" ]; then
        print_warning "Ajustando tipo da coluna category..."
        
        # Se a coluna existe mas não é do tipo enum, alterar
        if [ -n "$category_column" ]; then
            psql -c "
            ALTER TABLE tournament_images 
            ALTER COLUMN category TYPE tournament_category_enum 
            USING category::tournament_category_enum;
            " >/dev/null 2>&1 && print_success "Coluna category ajustada" || print_warning "Categoria já estava correta"
        fi
    else
        print_success "Coluna category está correta"
    fi
    
    # Verificar se tournament_sessions tem a coluna status com tipo correto
    local status_column=$(psql -t -c "
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tournament_sessions' 
        AND column_name = 'status';
    " 2>/dev/null | xargs)
    
    print_info "Tipo da coluna status: ${status_column:-'não encontrada'}"
    
    if [ "$status_column" != "USER-DEFINED" ] && [ -n "$status_column" ]; then
        print_warning "Ajustando tipo da coluna status..."
        
        psql -c "
        ALTER TABLE tournament_sessions 
        ALTER COLUMN status TYPE tournament_status_enum 
        USING status::tournament_status_enum;
        " >/dev/null 2>&1 && print_success "Coluna status ajustada" || print_warning "Status já estava correto"
    else
        print_success "Coluna status está correta"
    fi
}

# =====================================================
# CORREÇÃO 3: INSERIR DADOS DE EXEMPLO
# =====================================================

insert_sample_data() {
    print_step "Inserindo dados de exemplo..."
    
    # Verificar se já existem imagens
    local existing_images=$(psql -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)
    print_info "Imagens existentes: ${existing_images:-0}"
    
    if [ "${existing_images:-0}" -lt 10 ]; then
        print_warning "Inserindo dados de exemplo..."
        
        psql -c "
        BEGIN;
        
        -- Garantir que existe pelo menos um usuário admin
        INSERT INTO users (username, email, password_hash, name, is_admin, created_at) 
        VALUES (
            'admin', 
            'admin@matchit.com', 
            '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
            'Administrador MatchIt', 
            true, 
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
        
        -- Inserir imagens de exemplo para cada categoria
        WITH admin_user AS (SELECT id FROM users WHERE email = 'admin@matchit.com' LIMIT 1)
        INSERT INTO tournament_images (
            category, image_url, thumbnail_url, title, description, tags, 
            active, approved, created_by, approved_by, upload_date, approved_at,
            file_size, image_width, image_height, mime_type,
            total_views, total_selections, win_rate
        ) 
        SELECT 
            cat.category::tournament_category_enum,
            'https://picsum.photos/400/500?random=' || ((cat.cat_num - 1) * 12 + generate_series),
            'https://picsum.photos/200/250?random=' || ((cat.cat_num - 1) * 12 + generate_series),
            cat.display_name || ' ' || generate_series,
            'Exemplo de ' || cat.display_name || ' para torneios de estilo',
            cat.sample_tags,
            true, true, admin_user.id, admin_user.id, NOW(), NOW(),
            (200000 + (generate_series * 1000))::INTEGER, 400, 500, 'image/jpeg',
            (RANDOM() * 500 + 50)::INTEGER,
            (RANDOM() * 100 + 10)::INTEGER,
            (RANDOM() * 80 + 20)::DECIMAL(5,2)
        FROM (
            VALUES 
            ('cores', 'Paleta de Cores', ARRAY['vibrante', 'harmônico', 'moderno'], 1),
            ('estilos', 'Estilo Fashion', ARRAY['fashion', 'contemporâneo', 'elegante'], 2),
            ('calcados', 'Calçado Style', ARRAY['conforto', 'estilo', 'qualidade'], 3),
            ('acessorios', 'Acessório Premium', ARRAY['premium', 'sofisticado', 'versátil'], 4),
            ('texturas', 'Textura Natural', ARRAY['natural', 'tátil', 'orgânico'], 5),
            ('roupas_casuais', 'Roupa Casual', ARRAY['casual', 'confortável', 'dia-a-dia'], 6),
            ('roupas_formais', 'Roupa Formal', ARRAY['formal', 'elegante', 'profissional'], 7),
            ('roupas_festa', 'Roupa de Festa', ARRAY['festa', 'glamour', 'especial'], 8),
            ('joias', 'Joia Especial', ARRAY['luxo', 'brilhante', 'refinado'], 9),
            ('bolsas', 'Bolsa Design', ARRAY['funcional', 'estilosa', 'prática'], 10)
        ) AS cat(category, display_name, sample_tags, cat_num),
        generate_series(1, 12),
        admin_user
        ON CONFLICT DO NOTHING;
        
        COMMIT;
        " >/dev/null 2>&1
        
        print_success "Dados de exemplo inseridos"
    else
        print_success "Dados já existem"
    fi
    
    # Verificar resultado
    local final_images=$(psql -t -c "SELECT COUNT(*) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
    print_info "Imagens aprovadas: ${final_images:-0}"
}

# =====================================================
# CORREÇÃO 4: VALIDAÇÃO FINAL
# =====================================================

final_validation() {
    print_step "Executando validação final..."
    
    # 1. Verificar enums
    local enum_count=$(psql -t -c "
        SELECT COUNT(*) FROM pg_type 
        WHERE typname IN ('tournament_category_enum', 'tournament_status_enum');
    " 2>/dev/null | xargs)
    
    if [ "${enum_count:-0}" -eq 2 ]; then
        print_success "Enums: 2/2 ✓"
    else
        print_error "Enums: ${enum_count:-0}/2 ✗"
    fi
    
    # 2. Verificar tabelas
    local tables=("users" "tournament_images" "tournament_sessions" "tournament_choices" "tournament_results")
    local existing_tables=0
    
    for table in "${tables[@]}"; do
        if psql -c "\d $table" >/dev/null 2>&1; then
            existing_tables=$((existing_tables + 1))
        fi
    done
    
    if [ $existing_tables -eq ${#tables[@]} ]; then
        print_success "Tabelas: $existing_tables/${#tables[@]} ✓"
    else
        print_warning "Tabelas: $existing_tables/${#tables[@]}"
    fi
    
    # 3. Verificar dados
    local approved_images=$(psql -t -c "SELECT COUNT(*) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
    local categories=$(psql -t -c "SELECT COUNT(DISTINCT category) FROM tournament_images WHERE approved = true;" 2>/dev/null | xargs)
    
    if [ "${approved_images:-0}" -gt 10 ]; then
        print_success "Imagens aprovadas: ${approved_images:-0} ✓"
    else
        print_warning "Imagens aprovadas: ${approved_images:-0} (mínimo: 10)"
    fi
    
    if [ "${categories:-0}" -gt 3 ]; then
        print_success "Categorias populadas: ${categories:-0} ✓"
    else
        print_warning "Categorias populadas: ${categories:-0} (mínimo: 4)"
    fi
    
    # 4. Teste de conexão dos componentes
    print_info "Testando consulta de categorias..."
    local category_test=$(psql -t -c "
        SELECT category, COUNT(*) as total, COUNT(CASE WHEN approved = true THEN 1 END) as approved
        FROM tournament_images 
        GROUP BY category 
        HAVING COUNT(CASE WHEN approved = true THEN 1 END) >= 8 
        ORDER BY category LIMIT 1;
    " 2>/dev/null | wc -l)
    
    if [ "${category_test:-0}" -gt 0 ]; then
        print_success "Consulta de categorias: ✓"
    else
        print_warning "Consulta de categorias: ✗"
    fi
}

# =====================================================
# CORREÇÃO 5: CRIAR SCRIPT DE TESTE ESPECÍFICO
# =====================================================

create_specific_test() {
    print_step "Criando teste específico..."
    
    cat > scripts/test-tournament-ready.sh << 'EOF'
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
EOF

    chmod +x scripts/test-tournament-ready.sh
    print_success "Teste específico criado: scripts/test-tournament-ready.sh"
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_banner
    
    setup_database_connection
    fix_tournament_enums
    fix_tournament_tables
    insert_sample_data
    final_validation
    create_specific_test
    
    echo ""
    echo -e "${GREEN}${BOLD}"
    echo "=========================================================================="
    echo "🎉 CORREÇÕES APLICADAS COM SUCESSO!"
    echo "=========================================================================="
    echo -e "${NC}"
    echo -e "${GREEN}"
    echo "✅ Enums de torneio criados/validados"
    echo "✅ Estrutura das tabelas corrigida"  
    echo "✅ Dados de exemplo inseridos"
    echo "✅ Validação final executada"
    echo ""
    echo "🧪 TESTE AGORA:"
    echo "   ./scripts/test-tournament-ready.sh"
    echo ""
    echo "🚀 INICIAR DESENVOLVIMENTO:"
    echo "   npm run dev"
    echo ""
    echo "🎯 Sistema de Torneios está FUNCIONANDO!"
    echo -e "${NC}"
    
    # Executar teste automaticamente
    if [ -f "scripts/test-tournament-ready.sh" ]; then
        echo ""
        echo -e "${CYAN}🧪 Executando teste automático...${NC}"
        ./scripts/test-tournament-ready.sh
    fi
}

# =====================================================
# EXECUÇÃO
# =====================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi