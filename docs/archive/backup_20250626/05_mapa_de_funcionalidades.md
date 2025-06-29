# 🗺️ Mapa de Funcionalidades Implementadas - MatchIt

## 1. Visão Geral

Este documento serve como um índice para o código-fonte do projeto MatchIt, mapeando as principais funcionalidades implementadas aos seus respectivos arquivos. O objetivo é facilitar a navegação e o entendimento da arquitetura do código.

---

## 2. Mapeamento por Funcionalidade

### ⚙️ Configuração Geral e Servidor Principal
- **Objetivo**: Ponto de entrada da aplicação backend, configurações gerais, Docker e middlewares.
- **Arquivos Relevantes**:
    - `server/app.js`: Arquivo principal que inicializa o servidor Express.
    - `babel.config.js`: Configuração do Babel.
    - `docker-compose.yml`: Orquestração dos contêineres Docker.
    - `Dockerfile.backend`, `Dockerfile.frontend`: Definições dos contêineres.
    - `package.json`: Dependências e scripts do projeto.
    - `tsconfig.json`: Configurações do TypeScript.
    - `vite.config.ts`: Configurações do Vite para o frontend.

### 🗄️ Banco de Dados e Migrações
- **Objetivo**: Definição do schema do banco de dados, scripts de migração e configuração de conexão.
- **Arquivos Relevantes**:
    - `database/migrations/`: Diretório contendo todas as migrações SQL.
        - `006_add_algorithm_weights.sql`
        - `007_add_style_data_column.sql`
        - `008_add_emotional_profile_tables.sql`
    - `config/postgres/pg_hba.conf`: Configuração de autenticação do PostgreSQL.
    - `create_table.sql`: Script inicial de criação de tabelas (pode estar desatualizado em favor das migrações).

### 🧠 Sistema de Recomendação
- **Objetivo**: Lógica central para cálculo de compatibilidade e geração de recomendações.
- **Arquivos Relevantes**:
    - **Lógica Principal**:
        - `recommendation/match-score.ts`: Calcula o score final de compatibilidade.
        - `recommendation/base.ts`: Estruturas base para a recomendação.
        - `recommendation/index.ts`: Ponto de entrada do módulo de recomendação.
    - **Componentes do Algoritmo**:
        - `recommendation/emotional-match-calculator.ts`: (Planejado) Lógica para compatibilidade emocional.
        - `recommendation/weight-adjustment-algorithm.ts`: (Planejado) Lógica para ajuste de pesos.
    - **Rotas da API**:
        - `routes/recommendation/recommendations.ts`: Endpoint para obter recomendações.
        - `routes/recommendation/feedback.ts`: Endpoint para receber feedback do usuário (likes/dislikes).
    - **Análise e Interação**:
        - `recommendation/user-interaction-analytics.ts`: (Planejado) Análise de interações do usuário.
        - `recommendation/user-interaction-core.ts`: Lógica central de interação.

### 👤 Perfil do Usuário e Preferências
- **Objetivo**: Gerenciamento dos dados do usuário, incluindo perfil básico e preferências de estilo.
- **Arquivos Relevantes**:
    - **Telas (Frontend)**:
        - `screens/ProfileScreen.tsx`: Tela de visualização do perfil.
        - `screens/EditProfileScreen.tsx`: Tela de edição das informações básicas.
        - `screens/StyleAdjustmentScreen.tsx`: Tela para o usuário definir suas preferências de estilo.
    - **Componentes (Frontend)**:
        - `components/profile/`: Diretório com componentes relacionados ao perfil.
        - `components/profile/FeedbackTracker.tsx`: Componente para rastrear feedback.
        - `components/profile/PhotoUploader.tsx`: Componente para upload de fotos.
    - **Rotas da API (Backend)**:
        - `routes/emotional-profile.js`: (Planejado) Endpoints para o perfil emocional.

### 🖥️ Frontend: Telas Principais (Screens)
- **Objetivo**: As telas que compõem a interface principal do aplicativo.
- **Arquivos Relevantes**:
    - `screens/LoginScreen.tsx`: Tela de login.
    - `screens/MatchAreaScreen.tsx`: Tela principal onde as recomendações são exibidas.
    - `screens/ChatScreen.tsx`: Tela de chat.
    - `screens/SettingsScreen.tsx`: Tela de configurações.
    - `screens/TournamentScreen.ts`: (Planejado) Tela para o sistema de torneios.

### 🧩 Frontend: Componentes Reutilizáveis
- **Objetivo**: Componentes de UI genéricos usados em várias telas.
- **Arquivos Relevantes**:
    - `components/common/`: Diretório de componentes comuns.
        - `Button.tsx`, `Card.tsx`, `Modal.tsx`, `ProgressBar.tsx`, `Switch.tsx`, etc.
    - `components/navigation/BottomNavbar.tsx`: Barra de navegação inferior.
    - `components/gamification/AchievementNotification.tsx`: (Planejado) Notificação de conquista.

### 🔗 Frontend: Lógica e Gerenciamento de Estado (Hooks)
- **Objetivo**: Hooks customizados para encapsular a lógica de negócio e chamadas de API no frontend.
- **Arquivos Relevantes**:
    - `hooks/useApi.ts`: Hook central para fazer chamadas à API do backend.
    - `hooks/useEmotionalProfile.ts`: (Planejado) Hook para gerenciar dados do perfil emocional.
    - `hooks/analytics/useAnalytics.ts`: Hook para enviar eventos de analytics.

### 📝 Tipos e Interfaces
- **Objetivo**: Definições de tipos do TypeScript para garantir a consistência dos dados em todo o projeto.
- **Arquivos Relevantes**:
    - `types/`: Diretório principal para tipos.
    - `types/recommendation.ts`, `types/recommendation.d.ts`: Tipos para o sistema de recomendação.
    - `types/emotional-profile.ts`: Tipos para o perfil emocional.
    - `types/style-preferences.ts`: Tipos para as preferências de estilo.
    - `types/gamification.ts`: Tipos para o sistema de gamificação.
    - `global.d.ts`: Tipos globais.

### ✅ Testes
- **Objetivo**: Scripts de teste para garantir a qualidade e o funcionamento correto das funcionalidades.
- **Arquivos Relevantes**:
    - `tests/`: Diretório principal de testes.
    - `tests/emotional-profile.test.ts`: Testes para o perfil emocional.
    - `jest.setup.js`: Configuração do ambiente de testes Jest.
    - `scripts/manual-curl-test.sh`: Script para testes manuais via cURL.
