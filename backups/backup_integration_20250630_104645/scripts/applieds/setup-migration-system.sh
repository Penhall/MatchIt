#!/bin/bash
# scripts/setup-migration-system.sh - Configuração Completa do Sistema de Migrações MatchIt

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Função para log colorido
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    log $MAGENTA "================================================================="
    log $MAGENTA "$1"
    log $MAGENTA "================================================================="
    echo ""
}

print_step() {
    log $BLUE "🔄 $1"
}

print_success() {
    log $GREEN "✅ $1"
}

print_warning() {
    log $YELLOW "⚠️ $1"
}

print_error() {
    log $RED "❌ $1"
}

# Verificar dependências
check_dependencies() {
    print_header "VERIFICANDO DEPENDÊNCIAS"
    
    # Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_success "Node.js encontrado: $NODE_VERSION"
    else
        print_error "Node.js não encontrado. Instale Node.js >= 14"
        exit 1
    fi
    
    # PostgreSQL
    if command -v psql >/dev/null 2>&1; then
        print_success "PostgreSQL client encontrado"
    else
        print_error "PostgreSQL client não encontrado"
        exit 1
    fi
    
    # NPM packages
    if [ -f "package.json" ]; then
        print_success "package.json encontrado"
        if [ ! -d "node_modules" ]; then
            print_step "Instalando dependências npm..."
            npm install
        fi
    else
        print_error "package.json não encontrado. Execute na raiz do projeto MatchIt"
        exit 1
    fi
}

# Fazer backup dos arquivos atuais
create_backup() {
    print_header "CRIANDO BACKUP"
    
    BACKUP_DIR="backup_migrations_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    print_step "Fazendo backup em: $BACKUP_DIR"
    
    # Backup de todas as pastas de migração
    for dir in database/migrations scripts/migrations scripts server/migrations; do
        if [ -d "$dir" ]; then
            cp -r "$dir" "$BACKUP_DIR/" 2>/dev/null || true
            print_success "Backup: $dir"
        fi
    done
    
    # Backup dos scripts existentes
    for script in scripts/fix-database.sh scripts/setup-database.sh; do
        if [ -f "$script" ]; then
            cp "$script" "$BACKUP_DIR/" 2>/dev/null || true
            print_success "Backup: $script"
        fi
    done
    
    print_success "Backup completo em: $BACKUP_DIR"
}

# Executar análise de migrações
run_analysis() {
    print_header "ANÁLISE DE MIGRAÇÕES EXISTENTES"
    
    print_step "Executando análise completa..."
    node scripts/analyze-migrations.js
    
    echo ""
    read -p "$(log $CYAN '🤔 Continuar com a organização? (y/N): ')" -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operação cancelada pelo usuário"
        exit 0
    fi
}

# Organizar migrações
organize_migrations() {
    print_header "ORGANIZANDO MIGRAÇÕES"
    
    print_step "Executando organizador..."
    node scripts/organize-migrations.js
    
    print_success "Migrações organizadas na nova estrutura"
}

# Configurar banco de dados
setup_database() {
    print_header "CONFIGURANDO BANCO DE DADOS"
    
    # Verificar se .env existe
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado"
        print_step "Criando .env com configurações padrão..."
        
        cat > .env << 'EOF'
# Database Configuration - MatchIt
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Server Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-matchit-2025
JWT_EXPIRES_IN=7d
EOF
        print_success "Arquivo .env criado"
    fi
    
    # Testar conexão
    print_step "Testando conexão com banco..."
    node -e "
        require('dotenv').config();
        const { Client } = require('pg');
        const client = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        client.connect()
            .then(() => {
                console.log('✅ Conexão bem-sucedida');
                client.end();
            })
            .catch(err => {
                console.log('❌ Erro na conexão:', err.message);
                process.exit(1);
            });
    "
}

# Executar migrações essenciais
run_essential_migrations() {
    print_header "EXECUTANDO MIGRAÇÕES ESSENCIAIS"
    
    print_step "Inicializando sistema de controle..."
    node scripts/run-migrations.js run
    
    print_success "Migrações essenciais executadas"
}

# Verificar integridade
verify_system() {
    print_header "VERIFICANDO INTEGRIDADE DO SISTEMA"
    
    print_step "Verificando migrações..."
    node scripts/run-migrations.js verify
    
    print_step "Gerando relatório de status..."
    node scripts/run-migrations.js status
    
    print_success "Verificação concluída"
}

# Gerar documentação
generate_documentation() {
    print_header "GERANDO DOCUMENTAÇÃO"
    
    # Criar README do sistema de migrações
    cat > database/README.md << 'EOF'
# Sistema de Migrações MatchIt

Este diretório contém o sistema organizado de migrações do MatchIt.

## Estrutura

```
database/
├── migrations/
│   ├── core/           # Migrações essenciais (users, schema_migrations)
│   ├── features/       # Funcionalidades principais
│   ├── data/           # Seeds e dados iniciais
│   ├── indexes/        # Criação de índices
│   └── cleanup/        # Limpeza e otimizações
├── archive/
│   ├── old/            # Migrações antigas/obsoletas
│   ├── duplicates/     # Arquivos duplicados
│   └── broken/         # Migrações com problemas
└── migration-manifest.json  # Controle de migrações

```

## Comandos

### Executar migrações pendentes
```bash
node scripts/run-migrations.js run
```

### Ver status das migrações
```bash
node scripts/run-migrations.js status
```

### Verificar integridade
```bash
node scripts/run-migrations.js verify
```

### Forçar execução de uma migração específica
```bash
node scripts/run-migrations.js force 001
```

## Criando Nova Migração

1. Crie o arquivo na pasta apropriada:
   - `database/migrations/core/` - Para tabelas essenciais
   - `database/migrations/features/` - Para novas funcionalidades
   - `database/migrations/data/` - Para seeds
   - `database/migrations/indexes/` - Para índices

2. Nomeie o arquivo com formato: `NNN_descricao.sql`
   - Onde NNN é um número sequencial

3. Inclua comentário descritivo no início:
   ```sql
   -- Migration: Descrição da migração
   -- Criado em: YYYY-MM-DD
   
   CREATE TABLE exemplo (
       id SERIAL PRIMARY KEY,
       -- ...
   );
   ```

## Troubleshooting

### Migração falhou
```bash
# Ver logs de erro
psql -d matchit_db -c "SELECT * FROM migration_logs WHERE action = 'failed' ORDER BY executed_at DESC LIMIT 5;"

# Corrigir e forçar execução
node scripts/run-migrations.js force VERSAO
```

### Verificar tabelas existentes
```bash
psql -d matchit_db -c "\dt"
```

### Backup antes de mudanças importantes
```bash
pg_dump matchit_db > backup_$(date +%Y%m%d).sql
```
EOF

    print_success "Documentação criada: database/README.md"
    
    # Criar .gitignore se não existir
    if [ ! -f "database/.gitignore" ]; then
        cat > database/.gitignore << 'EOF'
# Arquivos temporários
*.tmp
*.backup
*.old

# Backups automáticos
backup_*

# Logs de migração
migration_*.log
EOF
        print_success "GitIgnore criado: database/.gitignore"
    fi
}

# Relatório final
final_report() {
    print_header "CONFIGURAÇÃO CONCLUÍDA"
    
    log $GREEN "🎉 Sistema de migrações configurado com sucesso!"
    echo ""
    
    log $CYAN "📁 Nova estrutura criada em: database/"
    log $CYAN "📋 Controle de migrações: database/migration-manifest.json"
    log $CYAN "📖 Documentação: database/README.md"
    echo ""
    
    log $YELLOW "🔧 Comandos principais:"
    log $NC "   node scripts/analyze-migrations.js    # Analisar migrações"
    log $NC "   node scripts/run-migrations.js run    # Executar pendentes"
    log $NC "   node scripts/run-migrations.js status # Ver status"
    echo ""
    
    log $YELLOW "📦 Backup criado em: $BACKUP_DIR"
    echo ""
    
    log $YELLOW "🎯 Próximos passos:"
    log $NC "1. Revisar nova estrutura em database/"
    log $NC "2. Executar: node scripts/run-migrations.js status"
    log $NC "3. Testar aplicação: npm run server"
    log $NC "4. Remover arquivos antigos se tudo funcionar"
    echo ""
}

# Função principal
main() {
    print_header "SETUP DO SISTEMA DE MIGRAÇÕES MATCHIT"
    
    log $CYAN "Este script irá:"
    log $NC "1. Analisar migrações existentes"
    log $NC "2. Criar backup de segurança"
    log $NC "3. Organizar arquivos em nova estrutura"
    log $NC "4. Configurar sistema de controle"
    log $NC "5. Executar migrações essenciais"
    log $NC "6. Verificar integridade"
    echo ""
    
    read -p "$(log $CYAN '🤔 Continuar? (y/N): ')" -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operação cancelada"
        exit 0
    fi
    
    # Executar passos
    check_dependencies
    create_backup
    run_analysis
    organize_migrations
    setup_database
    run_essential_migrations
    verify_system
    generate_documentation
    final_report
}

# Executar função principal
main "$@"