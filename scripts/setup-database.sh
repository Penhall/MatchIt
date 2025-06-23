#!/bin/bash

# scripts/setup-database.sh - Setup do banco de dados para Fase 0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para printar com cores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}${1}${NC}"
}

# Verificar se psql está disponível
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql não encontrado. Instale PostgreSQL client primeiro."
        exit 1
    fi
    print_status "psql encontrado"
}

# Verificar conexão com banco
check_connection() {
    print_info "Testando conexão com PostgreSQL..."
    
    # Usar as credenciais específicas do projeto
    DB_CONFIGS=(
        "postgresql://matchit:matchit123@localhost:5432/matchit_db"
        "postgresql://matchit:matchit123@localhost:5433/matchit_db"
        "postgresql://matchit:matchit123@127.0.0.1:5432/matchit_db"
    )
    
    for db_url in "${DB_CONFIGS[@]}"; do
        print_info "Tentando conectar: $db_url"
        if psql "$db_url" -c "SELECT NOW();" &>/dev/null; then
            print_status "Conexão estabelecida: $db_url"
            DB_CONNECTION="$db_url"
            return 0
        else
            print_warning "Falha na conexão: $db_url"
        fi
    done
    
    print_error "Não foi possível conectar ao banco de dados"
    print_info "Verifique se:"
    print_info "  - PostgreSQL está rodando"
    print_info "  - Banco 'matchit_db' existe"
    print_info "  - Usuário 'matchit' tem permissões"
    print_info "  - Senha 'matchit123' está correta"
    
    # Tentar criar banco se não existir
    print_info "Tentando criar banco se não existir..."
    if psql "postgresql://postgres:@localhost:5432/postgres" -c "CREATE DATABASE matchit_db;" &>/dev/null; then
        print_status "Banco matchit_db criado"
        if psql "postgresql://postgres:@localhost:5432/postgres" -c "CREATE USER matchit WITH PASSWORD 'matchit123';" &>/dev/null; then
            print_status "Usuário matchit criado"
        fi
        if psql "postgresql://postgres:@localhost:5432/postgres" -c "GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;" &>/dev/null; then
            print_status "Permissões concedidas"
        fi
        # Tentar conectar novamente
        if psql "postgresql://matchit:matchit123@localhost:5432/matchit_db" -c "SELECT NOW();" &>/dev/null; then
            print_status "Conexão estabelecida após criação"
            DB_CONNECTION="postgresql://matchit:matchit123@localhost:5432/matchit_db"
            return 0
        fi
    fi
    
    exit 1
}

# Verificar se tabela existe
check_table() {
    print_info "Verificando se tabela style_choices existe..."
    
    result=$(psql "$DB_CONNECTION" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'style_choices';" 2>/dev/null)
    
    if [[ $result == *"style_choices"* ]]; then
        print_status "Tabela style_choices já existe"
        return 0
    else
        print_warning "Tabela style_choices não existe"
        return 1
    fi
}

# Criar tabela
create_table() {
    print_info "Criando tabela style_choices..."
    
    psql "$DB_CONNECTION" <<EOF
CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);

-- Verificar criação
SELECT 'Tabela criada com sucesso!' as status;
EOF
    
    if [ $? -eq 0 ]; then
        print_status "Tabela style_choices criada com sucesso"
        print_status "Índices criados para performance"
    else
        print_error "Erro ao criar tabela"
        exit 1
    fi
}

# Verificar estrutura da tabela
verify_structure() {
    print_info "Verificando estrutura da tabela..."
    
    psql "$DB_CONNECTION" -c "\\d style_choices"
    
    if [ $? -eq 0 ]; then
        print_status "Estrutura da tabela verificada"
    else
        print_error "Erro ao verificar estrutura"
    fi
}

# Contar registros
count_records() {
    print_info "Contando registros na tabela..."
    
    count=$(psql "$DB_CONNECTION" -t -c "SELECT COUNT(*) FROM style_choices;" 2>/dev/null | tr -d ' ')
    
    if [ $? -eq 0 ]; then
        print_info "Total de registros: $count"
    else
        print_warning "Não foi possível contar registros"
    fi
}

# Função principal
main() {
    print_header "🚀 SETUP DO BANCO DE DADOS - FASE 0"
    echo ""
    
    # 1. Verificar psql
    check_psql
    
    # 2. Verificar conexão
    check_connection
    
    # 3. Verificar/criar tabela
    if ! check_table; then
        create_table
    fi
    
    # 4. Verificar estrutura
    verify_structure
    
    # 5. Contar registros
    count_records
    
    echo ""
    print_header "✅ SETUP CONCLUÍDO COM SUCESSO!"
    print_status "Banco de dados pronto para Fase 0"
    print_info "Tabela style_choices está disponível para uso"
    
    echo ""
    print_info "Próximos passos:"
    echo "  1. Execute: chmod +x scripts/test-phase0.sh"
    echo "  2. Execute: ./scripts/test-phase0.sh"
    echo ""
}

# Executar função principal
main "$@"