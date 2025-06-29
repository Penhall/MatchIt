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
```bash
# Usando script auxiliar
./docker-dev.sh

# Ou manualmente
docker compose --profile dev up --build
```

### Produção
```bash
# Usando script auxiliar
./docker-prod.sh

# Ou manualmente
docker compose up -d --build
```

### Outros Comandos
```bash
# Apenas backend + DB
docker compose up postgres redis backend -d

# Logs
docker compose logs -f backend

# Parar tudo
docker compose down

# Reset completo
./docker-reset.sh
```

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

- Use `docker compose logs -f` para acompanhar logs
- Configure backup automático do volume postgres_data
- Monitor recursos com `docker stats`
- Para produção, use registry privado

**Backup dos arquivos anteriores:** backup-20250628_221732

---
*Configuração gerada em: sáb, 28 de jun de 2025 22:17:37*
