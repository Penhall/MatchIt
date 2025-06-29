# 🚀 Próximos Passos e Plano de Ação - MatchIt

## 1. Visão Geral

Com base na análise de progresso e lacunas, este documento estabelece um plano de ação priorizado para direcionar o desenvolvimento do MatchIt. O foco é atacar as lacunas mais críticas que impedem o produto de atingir sua visão estratégica e diferencial competitivo.

---

## 2. Prioridades de Desenvolvimento

A seguir, as prioridades são listadas em ordem de importância estratégica.

### **Prioridade 1: Implementar o Sistema de Torneios (Core do Produto)**
- **Justificativa**: Esta é a funcionalidade mais crítica e fundamental. Sem ela, o aplicativo não tem seu principal mecanismo de engajamento e coleta de dados.
- **Prazo Estimado**: 14-18 dias.
- **Plano de Ação Detalhado**:
    1.  **Backend - Schema e Engine (7-8 dias)**:
        -   Criar as tabelas no banco de dados para `tournament_images`, `tournament_sessions` e `tournament_results`.
        -   Desenvolver o `TournamentEngine.ts`, o serviço principal que gerencia a lógica dos torneios.
        -   Implementar os endpoints da API para: iniciar um torneio, registrar uma escolha, obter o estado atual e ver os resultados.
    2.  **Backend - Painel de Administração (3-4 dias)**:
        -   Criar uma interface (mesmo que simples inicialmente) para o upload e categorização de imagens para os torneios.
        -   Implementar o endpoint para receber e salvar as imagens.
    3.  **Frontend - Interface do Torneio (4-5 dias)**:
        -   Desenvolver a tela `TournamentScreen.tsx`, que apresentará as batalhas 2x2.
        -   Integrar a tela com os endpoints da API do backend.
        -   Adicionar componentes visuais de progresso (ex: barra de progresso, rodada atual).

### **Prioridade 2: Finalizar a Integração da Fase 0**
- **Justificativa**: É crucial eliminar o uso de dados mockados para ter um fluxo de usuário completo e funcional, da seleção de preferências à recomendação.
- **Prazo Estimado**: 2-3 dias.
- **Plano de Ação Detalhado**:
    1.  **Backend (1 dia)**:
        -   Finalizar a lógica no `profileService.js` para buscar e salvar as preferências de estilo de forma robusta no banco de dados.
        -   Garantir que os endpoints de estilo estejam 100% funcionais e validados.
    2.  **Frontend (1-2 dias)**:
        -   Modificar `StyleAdjustmentScreen.tsx` para buscar as perguntas/opções de estilo da API, em vez de usar dados mockados.
        -   Implementar estados de `loading` e `error` para uma melhor experiência do usuário.
        -   Realizar testes de ponta a ponta para validar o fluxo.

### **Prioridade 3: Iniciar a Implementação do Perfil Emocional (Fase 2)**
- **Justificativa**: Após a implementação do core do produto (torneios), o perfil emocional é o próximo grande diferencial.
- **Prazo Estimado**: 10-12 dias.
- **Plano de Ação Detalhado**:
    1.  **Backend (5-6 dias)**:
        -   Executar a migração do banco de dados para criar as tabelas do perfil emocional.
        -   Desenvolver o `emotional-profile-service.ts` para gerenciar a lógica.
        -   Implementar a API para o questionário e cálculo de compatibilidade.
    2.  **Frontend (5-6 dias)**:
        -   Desenvolver o componente do questionário emocional (`EmotionalQuestionnaire`).
        -   Integrar o questionário com a API.
        -   Exibir insights emocionais básicos no perfil do usuário.

### **Prioridade 4: Desenvolver o Módulo de Aprendizado Adaptativo**
- **Justificativa**: Para que o sistema de recomendação se torne "inteligente", ele precisa aprender com o feedback do usuário.
- **Prazo Estimado**: 5-7 dias.
- **Plano de Ação Detalhado**:
    1.  **Backend (5-7 dias)**:
        -   Projetar e implementar o módulo `AdaptiveLearning`.
        -   Criar um mecanismo (ex: um job agendado ou um gatilho) que re-calcula e ajusta os pesos das dimensões de compatibilidade com base nos likes/dislikes recentes.
        -   Armazenar os pesos ajustados para serem usados nas próximas recomendações.

---

## 3. Cronograma Executivo Sugerido

| Sprint / Período | Foco Principal | Entregáveis |
| :--- | :--- | :--- |
| **Semanas 1-3** | **Sistema de Torneios e Finalização da Fase 0** | - Torneios 100% funcionais (Backend + Frontend). <br> - Tela de ajuste de estilo sem dados mockados. |
| **Semanas 4-5** | **Perfil Emocional (MVP)** | - Questionário emocional funcional. <br> - Score emocional integrado ao motor de recomendação. |
| **Semana 6** | **Aprendizado Adaptativo (MVP)** | - Sistema de ajuste de pesos implementado e operacional. |

Este plano de ação foca em entregar valor de forma incremental, priorizando as funcionalidades que definem a identidade do MatchIt e corrigindo as falhas fundamentais antes de avançar para funcionalidades mais complexas.
