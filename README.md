# 💕 MatchIt - App de Namoro com Torneios Visuais

## 🎯 Visão Geral

MatchIt é um aplicativo inovador de namoro que utiliza torneios visuais e inteligência artificial emocional para criar matches mais precisos e significativos entre usuários.

### ✨ Características Principais

- **Torneios Visuais**: Sistema único de votação em imagens para determinar preferências
- **IA Emocional**: Análise de perfil emocional para matches mais compatíveis
- **Dashboard Analytics**: Análise detalhada de comportamento e preferências
- **Chat em Tempo Real**: Sistema de mensagens integrado
- **Sistema de Ajuste de Pesos**: Algoritmo adaptativo de recomendação

## 🏗️ Arquitetura do Projeto

```
MatchIt/
├── 📱 frontend.User/          # Interface do usuário (React + TypeScript)
├── 🖥️  frontend.Admin/        # Painel administrativo (futuro)
├── ⚙️  backend/               # API Backend (Node.js + Express)
├── 🐳 infraestrutura/        # Docker + Nginx + PostgreSQL
├── 📚 docs/                  # Documentação completa
├── 🧪 tests/                 # Testes E2E, integração e unitários
└── 📋 Scripts/               # Scripts de automação
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker (opcional)

### 🔥 Execução Local (Recomendado)

```bash
# 1. Clone o repositório
git clone [repository-url]
cd MatchIt

# 2. Backend
cd backend
npm install
node simple-server.js

# 3. Frontend (em outro terminal)
cd ../frontend.User
npm install
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api/health

### 🐳 Execução com Docker

```bash
# Desenvolvimento
cd infraestrutura
./start-dev.sh

# Produção
./start-prod.sh
```

## 📱 Funcionalidades Implementadas

### ✅ Core Features
- [x] **Sistema de Autenticação** - Login/Registro seguro
- [x] **Gerenciamento de Perfil** - Edição completa do usuário
- [x] **Torneios Visuais** - Sistema de votação em imagens
- [x] **Ajuste de Estilo** - Personalização de preferências
- [x] **Match Area** - Área de conexões e matches
- [x] **Sistema de Chat** - Mensagens em tempo real
- [x] **Loja Virtual** - Marketplace integrado

### 🔧 Recursos Técnicos
- [x] **API RESTful** - Endpoints completos documentados
- [x] **Middleware de Segurança** - JWT, CORS, Rate Limiting
- [x] **Sistema de Analytics** - Métricas e dashboards
- [x] **Testes Automatizados** - 75% frontend, 100% backend
- [x] **Docker Containerizado** - 100% infraestrutura funcional
- [x] **Navegação Mobile** - Bottom navigation responsiva

## 🎨 Telas Disponíveis

| Tela | Rota | Status | Descrição |
|------|------|--------|-----------|
| 🏠 Home | `/` | ✅ | Tela inicial com torneios em destaque |
| 🔐 Login | `/login` | ✅ | Autenticação de usuários |
| 👤 Profile | `/profile` | ✅ | Perfil do usuário |
| ⚙️ Settings | `/settings` | ✅ | Configurações gerais |
| 🎨 Style | `/style-adjustment` | ✅ | Ajuste de preferências |
| 💖 Matches | `/match-area` | ✅ | Área de matches |
| 💬 Chat | `/chat` | ✅ | Sistema de mensagens |
| 🛒 Shop | `/vendor` | ✅ | Loja virtual |

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool e dev server
- **React Router** - Roteamento SPA
- **Tailwind CSS** - Estilização responsiva
- **i18next** - Internacionalização

### Backend
- **Node.js** + Express.js
- **PostgreSQL** - Banco principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Helmet** + CORS - Segurança

### DevOps
- **Docker** + Docker Compose
- **Nginx** - Proxy reverso
- **Vitest** - Testes frontend
- **Mocha/Chai** - Testes backend

## 📊 Status do Projeto

| Componente | Status | Progresso | Observações |
|------------|--------|-----------|-------------|
| Frontend | ✅ Ativo | 100% | Todas as telas implementadas |
| Backend | ✅ Ativo | 95% | Funcional sem banco |
| Database | ⚠️ Opcional | 90% | Migrations completas |
| Docker | ✅ Pronto | 100% | Infraestrutura validada |
| Testes | ✅ Passando | 85% | 14/14 backend, 9/12 frontend |

## 🧪 Execução de Testes

```bash
# Frontend
cd frontend.User
npm test

# Backend
cd backend
npm test

# E2E
cd tests
npm run test:e2e
```

## 📚 Documentação Adicional

- 📋 [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura detalhada
- 🐳 [DOCKER_SETUP_REPORT.md](docs/DOCKER_SETUP_REPORT.md) - Setup Docker
- 🔄 [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) - Guia de migrações
- 📖 [PLANO_INTEGRACAO.md](docs/PLANO_INTEGRACAO.md) - Plano de integração

## 🤝 Comandos de Desenvolvimento

```bash
# Desenvolvimento frontend
npm run dev          # Vite dev server
npm run build        # Build produção
npm run test         # Testes

# Desenvolvimento backend
npm start            # Servidor principal
node simple-server.js # Servidor sem banco
npm test             # Testes unitários

# Docker
./start-dev.sh       # Ambiente desenvolvimento
./start-prod.sh      # Ambiente produção
./test-infrastructure.sh # Validar infraestrutura
```

## 🎯 Próximos Passos

1. **Frontend.Admin** - Painel administrativo
2. **Sistema de Notificações** - Push notifications
3. **Integração com Banco** - PostgreSQL completo
4. **Deploy em Produção** - AWS/Azure
5. **App Mobile** - React Native

## 🐛 Troubleshooting

### Problemas Comuns

1. **CORS Error**: Verificar se backend está na porta 3000
2. **Página em Branco**: Usar `npm run dev` ao invés de `node server.js`
3. **Dependências**: Remover `node_modules` e reinstalar

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
npm run dev (console do navegador)
```

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ pela equipe MatchIt**

*Última atualização: 20/07/2025*