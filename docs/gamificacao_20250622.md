# Sistema de Gamificação - 22/06/2025

## 1. Visão Geral

O sistema de gamificação do MatchIt visa engajar os usuários e incentivar comportamentos desejados dentro do aplicativo, como completar o perfil, interagir com outros usuários e utilizar as funcionalidades do sistema de recomendação. Através de elementos de jogo, buscamos tornar a experiência do usuário mais divertida e recompensadora.

## 2. Elementos de Gamificação

### 2.1. Pontos de Experiência (XP)
- Os usuários ganham XP ao realizar ações específicas no aplicativo.
- Exemplos de ações que concedem XP:
    - Completar o perfil (preencher todas as informações, adicionar fotos).
    - Enviar e receber likes.
    - Iniciar conversas.
    - Participar de eventos ou desafios.
    - Fornecer feedback ao sistema de recomendação.

### 2.2. Níveis
- À medida que os usuários acumulam XP, eles sobem de nível.
- Cada nível pode desbloquear novas funcionalidades, ícones de perfil, ou outros benefícios.
- A progressão de nível serve como um indicador de engajamento e maestria no aplicativo.

### 2.3. Conquistas (Achievements)
- Conquistas são medalhas ou distintivos virtuais concedidos por atingir marcos específicos.
- Exemplos de conquistas:
    - "Perfil Completo": Por preencher 100% do perfil.
    - "Primeiro Match": Por conseguir o primeiro match.
    - "Social Borboleta": Por iniciar X conversas.
    - "Explorador de Estilo": Por ajustar as preferências de estilo Y vezes.
    - "Feedback Master": Por fornecer Z feedbacks ao sistema de recomendação.

### 2.4. Recompensas
- As recompensas podem ser virtuais ou, em alguns casos, tangíveis (se houver parcerias).
- Exemplos de recompensas:
    - Ícones e molduras de perfil exclusivos.
    - Emojis e adesivos especiais para o chat.
    - Acesso antecipado a novas funcionalidades.
    - Destaque temporário no feed de recomendações.
    - Descontos ou ofertas de parceiros (se aplicável).

## 3. Integração com o Sistema de Recomendação

A gamificação pode ser integrada ao sistema de recomendação incentivando os usuários a:
- **Ajustar preferências de estilo**: Conceder XP por cada ajuste de preferência, melhorando a qualidade das recomendações.
- **Fornecer feedback**: Recompensar usuários por dar likes/dislikes, o que alimenta o algoritmo de aprendizado adaptativo.
- **Interagir com recomendações**: Pontuar usuários por interagir com os perfis recomendados, aumentando o engajamento geral.

## 4. Implementação Técnica (Sugestões)

- **Backend**:
    - Tabela `users_xp` para armazenar pontos de experiência e nível.
    - Tabela `user_achievements` para registrar conquistas desbloqueadas.
    - Endpoints para conceder XP e registrar conquistas.
- **Frontend**:
    - Componentes para exibir XP, nível e conquistas no perfil do usuário.
    - Notificações pop-up para novas conquistas ou subidas de nível.
    - Barras de progresso para indicar o avanço para o próximo nível.

## 5. Próximos Passos

- Definir a lista completa de ações que concedem XP e suas respectivas pontuações.
- Criar uma lista detalhada de conquistas e seus critérios de desbloqueio.
- Planejar as recompensas para cada nível e conquista.
- Desenvolver a interface de usuário para exibir os elementos de gamificação.
- Implementar a lógica de backend para gerenciar XP, níveis e conquistas.
