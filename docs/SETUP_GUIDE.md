# 🚀 Guia de Setup - MatchIt

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Setup Local (Recomendado)](#setup-local)
3. [Setup com Docker](#setup-docker)
4. [Configuração de Desenvolvimento](#desenvolvimento)
5. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Obrigatórios
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** (incluído com Node.js)
- **Git** ([Download](https://git-scm.com/))

### Opcionais
- **Docker Desktop** (para containerização)
- **PostgreSQL** (se não usar Docker)
- **Redis** (para cache, opcional)

## 🏠 Setup Local

### 1. Clone o Projeto

```bash
git clone [repository-url]
cd MatchIt
```

### 2. Backend Setup

```bash
cd backend

# Instalar dependências
npm install

# Opção A: Servidor completo (requer PostgreSQL)
npm start

# Opção B: Servidor simplificado (sem banco)
node simple-server.js
```

### 3. Frontend Setup

```bash
cd ../frontend.User

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### 4. Verificar Funcionamento

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000/api/health

## 🐳 Setup com Docker

### Desenvolvimento

```bash
cd infraestrutura

# Iniciar todos os serviços
./start-dev.sh

# Verificar status
docker-compose ps
```

### Produção

```bash
cd infraestrutura

# Build e deploy
./start-prod.sh

# Verificar logs
docker-compose logs -f
```

### Serviços Disponíveis

| Serviço | URL | Porta |
|---------|-----|-------|
| Frontend Dev | http://localhost:5173 | 5173 |
| Frontend Prod | http://localhost | 80 |
| Backend API | http://localhost:3000 | 3000 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

## 💻 Configuração de Desenvolvimento

### Estrutura de Pastas

```
MatchIt/
├── 📱 frontend.User/          # Interface principal
│   ├── src/
│   │   ├── screens/           # 19 telas implementadas
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # Bibliotecas
│   ├── vite.config.ts         # Configuração Vite
│   └── package.json           # Dependências
│
├── ⚙️ backend/                # API Server
│   ├── server/
│   │   ├── routes/            # Endpoints da API
│   │   ├── middleware/        # Middleware customizado
│   │   └── services/          # Lógica de negócio
│   ├── simple-server.js       # Servidor sem banco
│   └── package.json           # Dependências
│
└── 🐳 infraestrutura/        # Docker setup
    ├── docker-compose.yml     # Orquestração
    ├── Dockerfile.backend     # Imagem backend
    └── nginx.conf             # Proxy config
```

### Comandos de Desenvolvimento

```bash
# Frontend
npm run dev          # Servidor Vite
npm run build        # Build produção
npm run test         # Testes Vitest
npm run preview      # Preview do build

# Backend  
npm start            # Servidor principal
node simple-server.js # Servidor teste
npm test             # Testes Mocha
npm run lint         # Linting

# Docker
./start-dev.sh       # Ambiente dev
./start-prod.sh      # Ambiente prod
./test-infrastructure.sh # Validar setup
```

### Configurações Importantes

#### Frontend (vite.config.ts)
```typescript
server: {
  port: 5173,
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

#### Backend (CORS)
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true
};
```

## 🧪 Executar Testes

### Frontend
```bash
cd frontend.User
npm test             # Todos os testes
npm run test:watch   # Modo watch
npm run test:coverage # Com coverage
```

### Backend
```bash
cd backend
npm test             # Testes unitários
npm run test:integration # Testes integração
```

### E2E
```bash
cd tests
npm run test:e2e     # Testes end-to-end
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de CORS
```
Access to fetch at 'http://localhost:3000/api/health' blocked by CORS policy
```

**Solução:**
- Verificar se backend está rodando na porta 3000
- Confirmar configuração CORS no backend
- Usar `node simple-server.js` se problemas persistirem

#### 2. Página em Branco no Frontend
```
Failed to load module script: MIME type mismatch
```

**Solução:**
- Usar `npm run dev` (Vite) ao invés de `node server.js`
- Verificar se `index.html` está correto
- Limpar cache: `rm -rf node_modules && npm install`

#### 3. Erro de Dependências
```
Module not found: Can't resolve 'react'
```

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### 4. Porta em Uso
```
Error: listen EADDRINUSE :::3000
```

**Solução:**
```bash
# Matar processo na porta
lsof -ti:3000 | xargs kill -9

# Ou usar porta diferente
PORT=3001 npm start
```

#### 5. Docker não Inicia
```
Cannot connect to the Docker daemon
```

**Solução:**
- Iniciar Docker Desktop
- Verificar permissões: `sudo usermod -aG docker $USER`
- Reiniciar sistema se necessário

### Debug Avançado

#### Logs Detalhados
```bash
# Backend logs
DEBUG=* npm start

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Vite logs detalhados
npm run dev -- --debug
```

#### Health Checks
```bash
# Backend
curl http://localhost:3000/api/health

# Frontend
curl http://localhost:5173

# Docker services
docker-compose exec backend curl localhost:3000/api/health
```

### Variáveis de Ambiente

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

#### Docker (.env)
```env
# Todas as configs já incluídas
# Verificar infraestrutura/.env
```

## 📞 Suporte

Se problemas persistirem:

1. Verificar [Issues no GitHub](link-do-repo/issues)
2. Consultar [Documentação Completa](docs/)
3. Executar `./test-infrastructure.sh` para diagnóstico

---

**Guia atualizado em: 20/07/2025**