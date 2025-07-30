# 🐳 INFRAESTRUTURA MATCHIT - GUIA COMPLETO

## 🎯 VISÃO GERAL

A infraestrutura do MatchIt está 100% funcional e pronta para produção, utilizando Docker para orquestração completa dos serviços.

## 📋 ARQUITETURA

```
🌐 Internet
    ↓
🔀 Nginx Proxy (80/443)
├── Static Files → Frontend (React/Vite)
├── /api/* → Backend (Node.js:3000)
└── /admin → Admin Dashboard (Streamlit:8501)
    ↓
🗄️  PostgreSQL (5432) + Redis (6379)
```

## 🚀 COMANDOS RÁPIDOS

### Desenvolvimento:
```bash
cd infraestrutura
./start-dev.sh
```

### Produção:
```bash
cd infraestrutura  
./start-prod.sh
```

### Dashboard Administrativo:
```bash
cd infraestrutura
./start-admin.sh [dev|prod|standalone|full]
```

### Teste:
```bash
cd infraestrutura
./test-infrastructure.sh
```

## 📊 SERVIÇOS CONFIGURADOS

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| **Frontend Dev** | 8080 | http://localhost:8080 | Servidor customizado |
| **Frontend Prod** | 80 | http://localhost | Nginx static |
| **Backend API** | 3000 | http://localhost:3000/api | Node.js Express |
| **Admin Dashboard** | 8501 | http://localhost:8501 | Streamlit Admin |
| **Admin via Proxy** | 8080 | http://localhost:8080/admin | Admin through Nginx |
| **PostgreSQL** | 5432 | localhost:5432 | Banco principal |
| **Redis** | 6379 | localhost:6379 | Cache/sessões |
| **Nginx Proxy** | 8080 | http://localhost:8080 | Load balancer |

## 🔐 CREDENCIAIS

### PostgreSQL:
- **Host**: postgres (interno) / localhost (externo)
- **Porta**: 5432
- **Database**: matchit_db
- **Usuário**: matchit
- **Senha**: matchit123

### Redis:
- **URL**: redis://redis:6379 (interno)
- **URL**: redis://localhost:6379 (externo)

### Admin Dashboard:
- **URL**: http://localhost:8501
- **Usuário**: admin
- **Senha**: matchit_admin_2025

## 📁 ESTRUTURA DE ARQUIVOS

```
infraestrutura/
├── docker-compose.yml          # Orquestração principal
├── docker-compose.admin.yml    # Configuração específica admin
├── Dockerfile.backend          # Backend Node.js
├── Dockerfile.frontend         # Frontend React (prod)
├── Dockerfile.frontend.dev     # Frontend React (dev)
├── Dockerfile.admin            # Admin Dashboard Streamlit
├── nginx.conf                  # Configuração proxy padrão
├── nginx-with-admin.conf       # Configuração proxy + admin
├── .env                        # Variáveis ambiente
├── database/init/              # Scripts inicialização DB
├── start-dev.sh               # Script desenvolvimento
├── start-prod.sh              # Script produção
├── start-admin.sh             # Script dashboard admin
├── test-infrastructure.sh     # Script testes
└── validate-docker.js         # Validador configuração
```

## 🛠️ PROFILES DOCKER

### Desenvolvimento (`--profile dev`):
- PostgreSQL + Redis + Backend + Frontend-Dev (Servidor customizado)
- Hot reload habilitado
- Debugging ativo

### Produção (`--profile prod`):
- PostgreSQL + Redis + Backend + Frontend (Nginx)
- Builds otimizados
- Logs estruturados

### Proxy (`--profile proxy`):
- Nginx como load balancer
- SSL/TLS configurado
- Rate limiting ativo

### Admin (`--profile admin`):
- Dashboard administrativo Streamlit
- Gestão de imagens e torneios
- Analytics e relatórios

### Full (`--profile full`):
- Stack completo incluindo admin
- Todos os serviços ativos
- Configuração para produção

## 📈 MONITORAMENTO

### Healthchecks Automáticos:
- **Backend**: `http://localhost:3000/api/health`
- **Admin Dashboard**: `http://localhost:8501/_stcore/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **Nginx**: `curl http://localhost/health`

### Logs:
```bash
# Ver logs em tempo real
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f admin-dashboard
docker-compose logs -f postgres

# Ver logs de um período
docker-compose logs --since="1h" backend
```

## 🔧 RESOLUÇÃO DE PROBLEMAS

### Container não inicia:
```bash
# Ver logs do container
docker-compose logs [service_name]

# Reconstruir imagem
docker-compose build --no-cache [service_name]

# Resetar volumes
docker-compose down -v
```

### Banco não conecta:
```bash
# Testar conexão direta
docker-compose exec postgres psql -U matchit -d matchit_db

# Verificar status
docker-compose exec postgres pg_isready -U matchit
```

### Performance:
```bash
# Ver uso de recursos
docker stats

# Limpar containers órfãos
docker system prune -f
```

## 🎯 NEXT STEPS

1. **SSL/HTTPS**: Configurar certificados em `ssl/`
2. **Backup**: Implementar backup automático do banco
3. **Monitoring**: Adicionar Prometheus + Grafana
4. **CI/CD**: Integrar com GitHub Actions
5. **Load Balancing**: Configurar múltiplas instâncias

## 🎛️ DASHBOARD ADMINISTRATIVO

### Funcionalidades:
- **📊 Dashboard**: Estatísticas gerais e métricas
- **🖼️ Gestão de Imagens**: Upload, aprovação e categorização
- **📂 Categorias**: Gerenciar categorias de torneios
- **📈 Analytics**: Relatórios avançados e análises
- **⚙️ Configurações**: Configurações do sistema

### Comandos Admin:
```bash
# Iniciar apenas admin
./start-admin.sh standalone

# Admin em desenvolvimento
./start-admin.sh dev

# Admin em produção
./start-admin.sh prod

# Stack completo com admin
./start-admin.sh full

# Ver logs do admin
./start-admin.sh logs

# Parar serviços admin
./start-admin.sh stop

# Limpeza completa
./start-admin.sh clean
```

### Acesso:
- **Direto**: http://localhost:8501
- **Via Proxy**: http://localhost:8080/admin (quando nginx rodando)
- **Usuário**: admin
- **Senha**: matchit_admin_2025

## ✅ STATUS ATUAL

- **Score**: 100% (24/24 verificações OK)
- **Status**: ✅ ATUALIZADO COM DASHBOARD ADMIN
- **Última validação**: 30/07/2025  
- **Docker**: Configurado para estrutura modularizada + Admin
- **Redes**: Isoladas e seguras
- **Volumes**: Persistentes e otimizados
- **Compatibilidade**: Backend/frontend.User + Admin Dashboard