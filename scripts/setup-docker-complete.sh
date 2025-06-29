#!/bin/bash
# scripts/setup-docker-complete.sh - Configuração completa Docker para MatchIt

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Variáveis globais
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly BACKUP_DIR="${PROJECT_ROOT}/backup-$(date +%Y%m%d_%H%M%S)"
readonly LOG_FILE="${PROJECT_ROOT}/docker-setup.log"

# Funções de logging
log() {
    local message="$1"
    local color="${2:-$NC}"
    echo -e "${color}${message}${NC}" | tee -a "$LOG_FILE"
}

log_step() {
    local step="$1"
    local message="$2"
    log "\n🔄 ${step}: ${message}" "$BLUE"
}

log_success() {
    local message="$1"
    log "✅ ${message}" "$GREEN"
}

log_warning() {
    local message="$1"
    log "⚠️ ${message}" "$YELLOW"
}

log_error() {
    local message="$1"
    log "❌ ${message}" "$RED"
}

log_header() {
    local message="$1"
    log "\n================================================================" "$CYAN"
    log " ${message}" "$CYAN"
    log "================================================================" "$CYAN"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para criar backup
create_backup() {
    log_step "BACKUP" "Criando backup dos arquivos Docker existentes"
    
    mkdir -p "$BACKUP_DIR"
    
    local docker_files=(
        "Dockerfile" "Dockerfile.backend" "Dockerfile.frontend" 
        "docker-compose.yml" ".dockerignore" "nginx.conf"
    )
    
    for file in "${docker_files[@]}"; do
        local file_path="${PROJECT_ROOT}/${file}"
        if [[ -f "$file_path" ]]; then
            cp "$file_path" "${BACKUP_DIR}/"
            log_success "Backup criado: ${file}"
        fi
    done
    
    log_success "Backup salvo em: $(basename "$BACKUP_DIR")"
}

# Função para validar projeto
validate_project() {
    log_step "VALIDAÇÃO" "Verificando estrutura do projeto"
    
    cd "$PROJECT_ROOT"
    
    local required_files=("package.json" "server/app.js")
    local required_dirs=("server" "scripts")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Arquivo obrigatório não encontrado: $file"
            exit 1
        fi
    done
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "Diretório obrigatório não encontrado: $dir"
            exit 1
        fi
    done
    
    log_success "Estrutura do projeto validada"
}

# Função para analisar projeto
analyze_project() {
    log_step "ANÁLISE" "Analisando dependências e configurações"
    
    cd "$PROJECT_ROOT"
    
    if [[ -f "package.json" ]]; then
        local project_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | cut -d'"' -f4 || echo "matchit-app")
        local project_version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | cut -d'"' -f4 || echo "1.0.0")
        local has_type_module=$(grep -q '"type"[[:space:]]*:[[:space:]]*"module"' package.json && echo "Sim" || echo "Não")
        
        log_success "Projeto: ${project_name} v${project_version}"
        log_success "ES Modules: ${has_type_module}"
    fi
}

# Função para criar Dockerfile.backend
create_dockerfile() {
    log_step "DOCKERFILE" "Criando Dockerfile.backend otimizado"
    
    cd "$PROJECT_ROOT"
    
    cat > Dockerfile.backend << 'EOF'
# Dockerfile.backend - Backend Node.js MatchIt (ES Modules)
FROM node:20-bullseye-slim AS base

# Instalar dependências do sistema necessárias
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Configurar usuário não-root para segurança
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# === STAGE 1: Dependencies ===
FROM base AS deps

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (produção + dev para build)
RUN npm ci --include=dev && npm cache clean --force

# === STAGE 2: Build ===
FROM base AS build

# Copiar dependências da stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Remover arquivos desnecessários
RUN rm -rf .git \
    docs \
    tests \
    *.md \
    .env.example \
    .gitignore

# === STAGE 3: Production ===
FROM base AS production

# Definir ambiente de produção
ENV NODE_ENV=production
ENV PORT=3000

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar aplicação construída
COPY --from=build --chown=nodejs:nodejs /app/server ./server
COPY --from=build --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=build --chown=nodejs:nodejs /app/.env* ./

# Criar diretórios necessários
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# Trocar para usuário não-root
USER nodejs

# Variáveis de ambiente padrão
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=matchit
ENV DB_PASSWORD=matchit123
ENV DB_NAME=matchit_db
ENV JWT_SECRET=matchit_secret_key_production_2024
ENV REDIS_URL=redis://redis:6379

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "server/app.js"]
EOF

    log_success "Dockerfile.backend criado"
}

# Função para criar docker-compose.yml
create_docker_compose() {
    log_step "COMPOSE" "Criando docker-compose.yml completo"
    
    cd "$PROJECT_ROOT"
    
    cat > docker-compose.yml << 'EOF'
# docker-compose.yml - MatchIt Completo
version: '3.8'

services:
  # Base de dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: matchit_db
      POSTGRES_USER: matchit
      POSTGRES_PASSWORD: matchit123
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/Banco de dados/init_db.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    ports:
      - "5432:5432"
    networks:
      - matchit-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U matchit -d matchit_db"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # Cache Redis
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - matchit-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
      target: production
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: matchit_db
      DB_USER: matchit
      DB_PASSWORD: matchit123
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-matchit_secret_key_production_2024}
      JWT_EXPIRES_IN: 7d
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000}
    ports:
      - "3000:3000"
    networks:
      - matchit-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  # Nginx Proxy (Produção)
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - matchit-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

# Configuração para desenvolvimento
  dev-backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
      target: build
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: development
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: matchit_db
      DB_USER: matchit
      DB_PASSWORD: matchit123
      REDIS_URL: redis://redis:6379
      JWT_SECRET: matchit_secret_key_dev
    ports:
      - "3001:3000"
    networks:
      - matchit-network
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    profiles:
      - dev

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  matchit-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

    log_success "docker-compose.yml criado"
}

# Função para criar arquivos de ambiente
setup_environment() {
    log_step "AMBIENTE" "Configurando variáveis de ambiente"
    
    cd "$PROJECT_ROOT"
    
    # Criar .env.example
    cat > .env.example << 'EOF'
# MatchIt - Variáveis de Ambiente
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logs
LOG_LEVEL=info

# Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    # Criar .env.docker para produção
    cat > .env.docker << 'EOF'
# MatchIt - Docker Production Environment
NODE_ENV=production
PORT=3000

# Database (Docker)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Redis (Docker)
REDIS_URL=redis://redis:6379

# JWT (Gere uma chave segura em produção)
JWT_SECRET=matchit_secret_key_production_2024
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Logs
LOG_LEVEL=warn

# Performance
MAX_FILE_SIZE=5MB
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
EOF

    log_success "Arquivos de ambiente criados"
}

# Função para criar .dockerignore
create_dockerignore() {
    log_step "IGNORE" "Criando .dockerignore"
    
    cd "$PROJECT_ROOT"
    
    cat > .dockerignore << 'EOF'
# MatchIt - Docker Ignore
# Dependências
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Ambiente local
.env
.env.local
.env.development
.env.test

# Logs
logs
*.log

# Temporários
.tmp
.cache
*.tmp

# OS
.DS_Store
Thumbs.db

# IDE
.vscode
.idea
*.swp
*.swo

# Git
.git
.gitignore

# Documentação
README.md
docs/
*.md

# Testes
tests/
coverage/
.nyc_output

# Build
dist/
build/

# Backup
backup-*/
*.backup

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# Uploads de desenvolvimento
uploads/
images/temp/
EOF

    log_success ".dockerignore criado"
}

# Função para criar configuração Nginx
create_nginx_config() {
    log_step "NGINX" "Criando configuração Nginx"
    
    cd "$PROJECT_ROOT"
    
    cat > nginx.conf << 'EOF'
# nginx.conf - MatchIt Proxy Configuration
upstream backend {
    server backend:3000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

server {
    listen 80;
    server_name localhost;
    
    # Logs
    access_log /var/log/nginx/matchit_access.log;
    error_log /var/log/nginx/matchit_error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Auth routes (mais restritivo)
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Upload files
    location /uploads/ {
        proxy_pass http://backend;
        client_max_body_size 10M;
        proxy_request_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Remove server header
    server_tokens off;
}
EOF

    log_success "nginx.conf criado"
}

# Função para validar configuração Docker
validate_docker_setup() {
    log_step "VALIDAÇÃO" "Verificando configuração Docker"
    
    # Verificar se Docker está instalado
    if command_exists docker; then
        local docker_version
        docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
        log_success "Docker encontrado: ${docker_version}"
    else
        log_warning "Docker não encontrado - instale Docker para usar"
    fi

    # Verificar se Docker Compose está instalado
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        local compose_version
        compose_version=$(docker compose version --short 2>/dev/null || echo "unknown")
        log_success "Docker Compose encontrado: ${compose_version}"
    else
        log_warning "Docker Compose não encontrado"
    fi

    # Verificar sintaxe do docker-compose.yml
    if command_exists docker && [[ -f "docker-compose.yml" ]]; then
        if docker compose config >/dev/null 2>&1; then
            log_success "docker-compose.yml válido"
        else
            log_warning "Erro na validação do docker-compose.yml"
        fi
    fi
}

# Função para criar diretórios necessários
create_directories() {
    log_step "ESTRUTURA" "Criando diretórios necessários"
    
    cd "$PROJECT_ROOT"
    
    local dirs=("logs" "uploads" "ssl" "scripts")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_success "Diretório criado: ${dir}/"
        else
            log "Diretório já existe: ${dir}/" "$CYAN"
        fi
    done
}

# Função para criar scripts auxiliares
create_helper_scripts() {
    log_step "SCRIPTS" "Criando scripts auxiliares"
    
    cd "$PROJECT_ROOT"
    
    # Script para subir ambiente de desenvolvimento
    cat > docker-dev.sh << 'EOF'
#!/bin/bash
# docker-dev.sh - Ambiente de desenvolvimento

echo "🚀 Iniciando ambiente de desenvolvimento MatchIt..."
docker compose --profile dev up --build -d

echo "📊 Status dos serviços:"
docker compose ps

echo "📝 Para acompanhar logs:"
echo "  docker compose logs -f dev-backend"
echo "  docker compose logs -f postgres"
EOF

    # Script para subir ambiente de produção
    cat > docker-prod.sh << 'EOF'
#!/bin/bash
# docker-prod.sh - Ambiente de produção

echo "🚀 Iniciando ambiente de produção MatchIt..."
docker compose up -d --build

echo "📊 Status dos serviços:"
docker compose ps

echo "📝 Para acompanhar logs:"
echo "  docker compose logs -f backend"
echo "  docker compose logs -f nginx"
EOF

    # Script para reset completo
    cat > docker-reset.sh << 'EOF'
#!/bin/bash
# docker-reset.sh - Reset completo do ambiente

echo "⚠️  ATENÇÃO: Isso irá remover TODOS os dados!"
read -p "Continuar? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Parando e removendo containers..."
    docker compose down -v
    
    echo "🗑️  Removendo imagens..."
    docker image prune -a -f
    
    echo "💽 Removendo volumes..."
    docker volume prune -f
    
    echo "✅ Reset completo realizado!"
else
    echo "❌ Operação cancelada"
fi
EOF

    # Tornar scripts executáveis
    chmod +x docker-dev.sh docker-prod.sh docker-reset.sh
    
    log_success "Scripts auxiliares criados"
}

# Função para gerar relatório final
generate_report() {
    log_step "RELATÓRIO" "Gerando relatório de configuração"
    
    cd "$PROJECT_ROOT"
    
    local report_file="DOCKER_SETUP_REPORT.md"
    
    cat > "$report_file" << EOF
# Configuração Docker - MatchIt

## 📁 Arquivos Criados

✅ **Dockerfile.backend** - Container backend otimizado  
✅ **docker-compose.yml** - Orquestração completa  
✅ **.dockerignore** - Exclusões para build  
✅ **nginx.conf** - Proxy reverso configurado  
✅ **.env.example** - Template de ambiente  
✅ **.env.docker** - Ambiente Docker  
✅ **docker-dev.sh** - Script desenvolvimento  
✅ **docker-prod.sh** - Script produção  
✅ **docker-reset.sh** - Script reset  

## 🔧 Configuração

- Node.js 20 Alpine
- PostgreSQL 15 com persistência
- Redis para cache
- Nginx como proxy reverso
- Health checks configurados
- Usuário não-root para segurança
- Multi-stage build otimizado

## 🚀 Comandos Disponíveis

### Desenvolvimento
\`\`\`bash
# Usando script auxiliar
./docker-dev.sh

# Ou manualmente
docker compose --profile dev up --build
\`\`\`

### Produção
\`\`\`bash
# Usando script auxiliar
./docker-prod.sh

# Ou manualmente
docker compose up -d --build
\`\`\`

### Outros Comandos
\`\`\`bash
# Apenas backend + DB
docker compose up postgres redis backend -d

# Logs
docker compose logs -f backend

# Parar tudo
docker compose down

# Reset completo
./docker-reset.sh
\`\`\`

## 📊 Portas Configuradas

- **3000** - Backend API (produção)
- **3001** - Backend API (desenvolvimento)
- **5432** - PostgreSQL
- **6379** - Redis
- **80** - Nginx (HTTP)
- **443** - Nginx (HTTPS - configure SSL)

## 🔒 Segurança

- Usuário não-root nos containers
- Rate limiting configurado
- Headers de segurança
- Logs estruturados
- Health checks automáticos

## ⚠️ Importante

1. Altere JWT_SECRET em produção
2. Configure SSL para HTTPS
3. Ajuste variáveis de ambiente em .env.docker
4. Execute migrações do banco após subir

## 💡 Dicas

- Use \`docker compose logs -f\` para acompanhar logs
- Configure backup automático do volume postgres_data
- Monitor recursos com \`docker stats\`
- Para produção, use registry privado

**Backup dos arquivos anteriores:** $(basename "$BACKUP_DIR")

---
*Configuração gerada em: $(date)*
EOF

    log_success "Relatório salvo em: ${report_file}"
}

# Função principal
main() {
    log_header "CONFIGURAÇÃO DOCKER - MATCHIT"
    
    # Inicializar log
    echo "# Docker Setup Log - $(date)" > "$LOG_FILE"
    
    # Validações iniciais
    validate_project
    analyze_project
    
    # Backup
    create_backup
    
    # Criação dos arquivos
    create_dockerfile
    create_docker_compose
    setup_environment
    create_dockerignore
    create_nginx_config
    create_directories
    create_helper_scripts
    
    # Validação final
    validate_docker_setup
    
    # Relatório
    generate_report
    
    log_header "CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!"
    
    echo ""
    log "🚀 Próximos passos:" "$GREEN"
    log "   1. Execute: ./docker-dev.sh (desenvolvimento)" "$CYAN"
    log "   2. Ou: ./docker-prod.sh (produção)" "$CYAN"
    log "   3. Acesse: http://localhost:3000/api/health" "$CYAN"
    echo ""
    log "📖 Veja o relatório completo em: DOCKER_SETUP_REPORT.md" "$BLUE"
    log "📝 Log detalhado salvo em: $(basename "$LOG_FILE")" "$BLUE"
    echo ""
}

# Verificar se está sendo executado como script principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
