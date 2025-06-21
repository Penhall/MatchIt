# Fluxo de Execução do Sistema de Recomendação

Este documento descreve o fluxo de execução das principais funções e componentes do sistema de recomendação, com base na análise dos arquivos `services/recommendation/RecommendationService.ts` e `routes/recommendation/recommendations.ts`.

## 1. `RecommendationService.getMatches(userId: string)`

Esta função, definida em `services/recommendation/RecommendationService.ts`, é responsável por obter as recomendações de matches para um determinado usuário.

### Fluxo de Execução:

1.  A função recebe o `userId` do usuário para o qual as recomendações devem ser geradas.
2.  Atualmente, a implementação é simulada e retorna um array fixo de `['match1', 'match2', 'match3']`.
3.  Em uma implementação real, esta função consultaria o banco de dados, aplicaria os algoritmos de recomendação e retornaria uma lista de IDs de usuários que são bons matches para o `userId` fornecido.

## 2. `RecommendationService.processFeedback(userId: string, matchId: string, feedback: string)`

Esta função, também definida em `services/recommendation/RecommendationService.ts`, é responsável por processar o feedback do usuário sobre um determinado match.

### Fluxo de Execução:

1.  A função recebe o `userId` do usuário que está dando o feedback, o `matchId` do usuário sobre o qual o feedback está sendo dado e o `feedback` (por exemplo, 'like', 'dislike').
2.  Atualmente, a implementação é simulada e apenas registra o feedback no console.
3.  Em uma implementação real, esta função atualizaria o banco de dados com o feedback, recalcularia os pesos do usuário e possivelmente invalidaria o cache.

## 3. Rotas de Recomendação (`routes/recommendation/recommendations.ts`)

O arquivo `routes/recommendation/recommendations.ts` define as rotas da API para o sistema de recomendação.

### 3.1. `GET /api/recommendations`

Esta rota é responsável por obter as recomendações para um usuário.

#### Fluxo de Execução:

1.  A rota recebe uma requisição GET para `/api/recommendations`.
2.  O middleware `requireAuth` verifica se o usuário está autenticado.
3.  O middleware `rateLimitMiddleware` verifica se o usuário não excedeu o limite de requisições.
4.  A rota extrai o `userId` do usuário autenticado.
5.  A rota extrai os parâmetros da query string:
    *   `algorithm`: Algoritmo de recomendação a ser usado (padrão: 'hybrid').
    *   `limit`: Número máximo de recomendações a serem retornadas (padrão: 20, máximo: 50).
    *   `refresh`: Se deve forçar a atualização do cache (padrão: false).
    *   Filtros como `ageMin`, `ageMax`, `maxDistance`, `genders`, `verifiedOnly`, `vipOnly`.
6.  A rota valida os parâmetros e filtros.
7.  A rota chama a função `recommendationService.getRecommendations(userId, options)` para obter as recomendações.
8.  A rota formata a resposta e a retorna para o usuário.

### 3.2. `POST /api/recommendations/feedback`

Esta rota é responsável por registrar o feedback do usuário sobre um determinado match.

#### Fluxo de Execução:

1.  A rota recebe uma requisição POST para `/api/recommendations/feedback`.
2.  O middleware `requireAuth` verifica se o usuário está autenticado.
3.  O middleware `rateLimitMiddleware` verifica se o usuário não excedeu o limite de requisições.
4.  A rota extrai o `userId` do usuário autenticado.
5.  A rota extrai os dados do corpo da requisição:
    *   `targetUserId`: ID do usuário sobre o qual o feedback está sendo dado.
    *   `action`: Ação de feedback (por exemplo, 'like', 'dislike').
    *   `context`: Contexto do feedback.
6.  A rota valida os dados.
7.  A rota chama a função `recommendationService.recordFeedback(userId, targetUserId, action, context)` para registrar o feedback.
8.  A rota formata a resposta e a retorna para o usuário.

### 3.3. `GET /api/recommendations/stats`

Esta rota é responsável por obter as estatísticas do usuário.

#### Fluxo de Execução:

1.  A rota recebe uma requisição GET para `/api/recommendations/stats`.
2.  O middleware `requireAuth` verifica se o usuário está autenticado.
3.  A rota extrai o `userId` do usuário autenticado.
4.  A rota chama a função `recommendationService.getUserStats(userId)` para obter as estatísticas.
5.  A rota formata a resposta e a retorna para o usuário.

### 3.4. `PUT /api/recommendations/preferences`

Esta rota é responsável por atualizar as preferências de algoritmo do usuário.

#### Fluxo de Execução:

1.  A rota recebe uma requisição PUT para `/api/recommendations/preferences`.
2.  O middleware `requireAuth` verifica se o usuário está autenticado.
3.  A rota extrai o `userId` do usuário autenticado.
4.  A rota extrai os dados do corpo da requisição:
    *   `weights`: Pesos dos diferentes fatores de compatibilidade.
    *   `algorithm`: Algoritmo de recomendação preferido.
5.  A rota valida os dados.
6.  A rota atualiza as preferências do usuário no banco de dados.
7.  A rota formata a resposta e a retorna para o usuário.

## 4. Estrutura do Banco de Dados

A estrutura do banco de dados está definida nos scripts SQL encontrados no diretório `scripts/Banco de dados/`. O banco de dados PostgreSQL é configurado através do Docker Compose usando a imagem `postgres:15-alpine`.

### Configuração do Banco de Dados:
- Usuário: `matchit`
- Senha: `matchit123`
- Nome do banco: `matchit_db`
- Porta: `5432`
- Script de inicialização: `scripts/Banco de dados/init_db.sql`

### Tabelas Principais:

1. **users** (definida em `init_db.sql`):
   - Armazena informações básicas dos usuários (ID, email, hash da senha, nome)
   - Contém coluna `is_active` para controle de contas ativas

2. **user_profiles** (definida em `init_db.sql`):
   - Armazena informações detalhadas do perfil dos usuários
   - Relacionada à tabela `users` através de chave estrangeira
   - Armazena dados de estilo em formato JSONB

3. **matches** (definida em `init_db.sql`):
   - Registra os matches entre usuários
   - Armazena pontuação de compatibilidade

### Estrutura Expandida (db_setup_part1.sql):
O script `db_setup_part1.sql` define uma estrutura mais completa com:
- Uso de UUIDs como chaves primárias
- Tabelas adicionais: `style_choices`, `chat_messages`, `products`, `user_subscriptions`
- Índices para otimização de consultas
- Triggers para atualização automática de timestamps

### Configurações de Ambiente:
- **Arquivo .env**: Contém todas as credenciais e configurações necessárias para conexão com o banco de dados
- **Dockerfiles**: Configuram o ambiente para desenvolvimento local e produção
- **docker-compose.yml**: Orquestra os serviços de banco de dados, backend e frontend

### Verificação de Preparação:
A estrutura atual definida nos scripts SQL contém todas as tabelas necessárias para o funcionamento do sistema de recomendação, incluindo:
- Armazenamento de perfis de usuário com dados de estilo
- Registro de matches e pontuações de compatibilidade
- Mecanismos para feedback (implícito na estrutura de `matches`)
- Suporte para estatísticas de usuário

As tabelas `users`, `user_profiles` e `matches` são as principais para o sistema de recomendação e estão completamente definidas nos scripts encontrados no projeto.
