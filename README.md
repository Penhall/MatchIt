# MatchIt - Style & Emotion Connect

Aplicação de match de estilos usando Docker e PostgreSQL

## Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local)

## Configuração

1. Clone o repositório
2. Crie um arquivo `.env` baseado no `.env.example`
3. Configure as variáveis de ambiente conforme necessário

## Rodando com Docker

```bash
docker-compose up --build
```

Isso irá:
- Iniciar o container PostgreSQL
- Construir e iniciar o backend Node.js
- Construir e iniciar o frontend React
- Configurar o Nginx como proxy reverso

A aplicação estará disponível em:
- Frontend: http://localhost
- Backend API: http://localhost/api
- PostgreSQL: porta 5432

## Comandos úteis

**Rodar em desenvolvimento (sem Docker):**
```bash
# Backend
npm run server

# Frontend 
npm run dev
```

**Acessar banco de dados:**
```bash
docker exec -it matchit-postgres psql -U matchit -d matchit_db
```

**Reiniciar serviços específicos:**
```bash
docker-compose restart backend
```

## Variáveis de ambiente

Veja o arquivo `.env.example` para todas as variáveis disponíveis.

## Estrutura do projeto

- `backend/`: Servidor Node.js com Express
- `frontend/`: Aplicação React
- `docker-compose.yml`: Configuração dos serviços Docker
- `Dockerfile.backend`: Dockerfile para o backend
- `Dockerfile.frontend`: Dockerfile para o frontend
- `nginx.conf`: Configuração do Nginx
- `scripts/init_db.sql`: Script de inicialização do banco de dados
