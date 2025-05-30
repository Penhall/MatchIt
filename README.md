# MatchIt - Style & Emotion Connect

Um aplicativo inovador de dating que conecta pessoas através de afinidades estéticas, emocionais e comportamentais. Em vez de focar apenas em aparência, o MatchIt cria conexões baseadas em escolhas de estilo, cores, hobbies e sentimentos.

## 🎯 Visão Geral

O MatchIt utiliza um sistema de "Style Adjustment" onde usuários fazem escolhas visuais entre pares de imagens em 5 categorias principais:
- **Tênis** - Preferências de calçados
- **Roupas** - Estilos de vestuário
- **Cores** - Paletas de cores favoritas
- **Hobbies** - Atividades de lazer
- **Sentimentos** - Estados emocionais

O algoritmo inteligente calcula compatibilidades multidimensionais e sugere matches com base nessas afinidades profundas.

## 🚀 Funcionalidades Principais

- **Sistema de Autenticação** com login social (Google/Apple)
- **Style Adjustment** - Quiz visual interativo para definir perfil
- **Match Area** - Descoberta de perfis compatíveis com percentual de afinidade
- **Chat System** - Conversas entre matches confirmados
- **Vendor Area** - Recomendações de produtos baseadas no perfil
- **Radar Chart** - Visualização do perfil de estilo do usuário
- **Sistema VIP** - Funcionalidades premium e sem anúncios

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Recharts** para gráficos
- **React i18next** para internacionalização

### Backend
- **Node.js** com Express
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **bcryptjs** para hash de senhas

### DevOps
- **Docker** e **Docker Compose**
- **Nginx** como proxy reverso
- **Vite** para build otimizado

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js 18+** (para desenvolvimento local)
- **Git** para controle de versão

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <repository-url>
cd matchit-app
```

### 2. Configuração de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```bash
# Configurações do PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_USER=matchit
DB_PASSWORD=matchit123
DB_NAME=matchit_db

# Configurações de autenticação
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

# Configurações do servidor
PORT=3000
NODE_ENV=production
```

### 3. Executar com Docker (Recomendado)
```bash
# Build e execução completa
docker-compose up --build

# Executar em background
docker-compose up -d --build
```

### 4. Desenvolvimento Local (Opcional)
```bash
# Instalar dependências
npm install

# Executar backend
npm run server

# Executar frontend (em outro terminal)
npm run dev
```

## 🌐 Acessos da Aplicação

Após a execução bem-sucedida:

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api  
- **PostgreSQL**: localhost:5432
- **Desenvolvimento Frontend**: http://localhost:5173 (se rodando localmente)

## 📁 Estrutura do Projeto

```
matchit-app/
├── screens/                    # Telas principais da aplicação
│   ├── LoginScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── StyleAdjustmentScreen.tsx
│   ├── MatchAreaScreen.tsx
│   ├── ChatScreen.tsx
│   ├── VendorScreen.tsx
│   └── SettingsScreen.tsx
├── components/                 # Componentes reutilizáveis
│   ├── common/                # Componentes básicos
│   ├── navigation/            # Navegação e menus
│   └── profile/               # Componentes específicos de perfil
├── context/                   # Contextos React
│   └── AuthContext.tsx
├── src/                       # Assets e configurações
│   ├── assets/
│   ├── locales/              # Traduções
│   └── i18n.ts
├── docs/                      # Documentação
├── scripts/                   # Scripts de banco
│   └── init_db.sql
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── server.js                 # Servidor Express
├── constants.ts              # Constantes e dados mock
├── types.ts                  # Definições TypeScript
└── package.json
```

## 🐳 Comandos Docker Úteis

### Gerenciamento de Containers
```bash
# Ver status dos serviços
docker-compose ps

# Parar todos os serviços
docker-compose down

# Restart de serviço específico
docker-compose restart backend
docker-compose restart frontend

# Ver logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Banco de Dados
```bash
# Acessar PostgreSQL
docker exec -it matchit-postgres psql -U matchit -d matchit_db

# Backup do banco
docker exec matchit-postgres pg_dump -U matchit matchit_db > backup.sql

# Restore do banco
docker exec -i matchit-postgres psql -U matchit -d matchit_db < backup.sql
```

### Desenvolvimento
```bash
# Rebuild apenas um serviço
docker-compose up --build backend

# Executar comandos dentro do container
docker exec -it matchit-backend npm install
docker exec -it matchit-backend npm run migrate
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia Vite dev server
npm run server       # Inicia backend com nodemon

# Build
npm run build        # Build de produção com Vite
npm run preview      # Preview do build

# Backend
npm start           # Inicia servidor de produção
npm run server      # Desenvolvimento com nodemon
```

## 📊 Funcionalidades Implementadas

### ✅ Concluído
- [x] Sistema de autenticação básico
- [x] Todas as telas principais (Login, Profile, Style Adjustment, Match Area, Chat, Vendor, Settings)
- [x] Componentes reutilizáveis (Button, Card, Avatar, Modal, etc.)
- [x] Sistema de navegação com Bottom Navbar
- [x] Tema dark com cores neon
- [x] Gráfico radar para visualização de estilo
- [x] Sistema de internacionalização (PT-BR)
- [x] Configuração Docker completa

### 🚧 Em Desenvolvimento
- [ ] Integração completa com backend
- [ ] Algoritmo de matching inteligente
- [ ] Sistema de pagamentos (Stripe/Mercado Pago)
- [ ] Upload e gestão de imagens
- [ ] Notificações push
- [ ] Testes automatizados

### 📝 Próximas Fases
- [ ] Beta testing com usuários reais
- [ ] Otimizações de performance
- [ ] Deploy em produção
- [ ] Expansão de funcionalidades VIP

## 🎨 Design System

O MatchIt utiliza um design futurístico com:
- **Cores Neon**: Azul (#00FFFF), Verde (#39FF14), Laranja (#FF8C00)
- **Tema Dark**: Backgrounds escuros com acentos luminosos
- **Efeitos Glow**: Sombras e bordas com brilho neon
- **Animações**: Transições suaves e efeitos hover
- **Typography**: Gradientes e texto brilhante

## 🌐 Internacionalização

Atualmente suportado:
- **Português (PT-BR)** - Idioma padrão

Preparado para expansão:
- Inglês (EN)
- Espanhol (ES)

## 🔒 Segurança

- Autenticação JWT
- Hash de senhas com bcrypt
- Validação de dados no backend
- Sanitização de inputs
- HTTPS em produção (configurar certificados)

## 📈 Monitoramento e Logs

```bash
# Monitorar logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f postgres
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas e suporte:
- **Email**: dev@matchit.app
- **GitHub Issues**: Use para reportar bugs e solicitar features

---

**MatchIt** - Conecte-se por estilo, escolha e sentimento 💫