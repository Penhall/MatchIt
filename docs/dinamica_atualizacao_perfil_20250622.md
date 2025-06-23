# Dinâmica de Atualização do Perfil - 22/06/2025 (Atualizado)

## 1. Visão Geral

A atualização do perfil no MatchIt é um processo fundamental para garantir que as recomendações sejam precisas e relevantes. Os usuários podem modificar suas informações pessoais, preferências de estilo e outras configurações, e essas alterações são refletidas no sistema de recomendação e na experiência geral do aplicativo. O "Style Adjustment" é uma funcionalidade central para a construção do perfil, permitindo que o usuário se expresse através de escolhas visuais.

## 2. Campos do Perfil e Atualização

### 2.1. Informações Básicas
- **Campos**: Idade, gênero, localização, nome.
- **Atualização**: Através do serviço `updateProfile` no frontend, que interage com o backend para persistir as mudanças.
- **Impacto**: Afetam diretamente os filtros de busca e a proximidade nas recomendações.

### 2.2. Preferências de Estilo (`stylePreferences`) - "Style Adjustment"
- **Campos**: Preferências em tênis, roupas, cores, hobbies e sentimentos. Essas são as 5 categorias principais onde o usuário escolhe entre pares de imagens para construir seu perfil.
- **Atualização**: Realizada na "Tela de Ajuste de Estilo" (`screens/StyleAdjustmentScreen.tsx`). O frontend envia as atualizações via `updateStylePreference` para o backend.
- **Armazenamento**: Os dados são salvos como JSONB na tabela `user_profiles` no PostgreSQL.
- **Impacto**: Essencial para o cálculo de compatibilidade de estilo no algoritmo de recomendação. Alterações aqui podem levar a um novo conjunto de recomendações. A "Taxa de conclusão do Style Adjustment" é uma métrica chave para o engajamento inicial.

### 2.3. Preferências de Busca (`preferences`)
- **Campos**: Faixa etária (`ageRange`), distância máxima (`maxDistance`).
- **Atualização**: Geralmente configuradas em telas de filtro ou configurações de busca.
- **Impacto**: Filtram os candidatos antes do cálculo de compatibilidade, refinando o universo de possíveis matches.

### 2.4. Personalidade Parcial (`personalityVector`)
- **Campos**: Vetor de personalidade (implementação parcial).
- **Atualização**: Atualmente, a forma de atualização completa não está detalhada, mas espera-se que seja através de questionários ou interações específicas.
- **Impacto**: Contribui para o cálculo de compatibilidade de personalidade no algoritmo de recomendação.

### 2.5. Campos Faltantes (Futuras Implementações)
- **Perfil Emocional Completo (`emotionalProfile`)**: Previsão de implementação para enriquecer as recomendações.
- **Nível de Atividade (`activityLevel`)**: Pode influenciar a frequência e o tipo de interações recomendadas.

## 3. Fluxo de Atualização

1. **Usuário Inicia Atualização**: O usuário acessa a tela de edição de perfil ou ajuste de estilo no frontend.
2. **Modificação dos Dados**: O usuário altera os campos desejados.
3. **Envio para o Backend**: O frontend envia uma requisição (PUT/POST) para o endpoint apropriado no backend (ex: `/api/profile`, `/api/profile/style-preferences`).
4. **Validação e Persistência**: O backend valida os dados recebidos e os persiste no banco de dados (tabela `user_profiles`).
5. **Impacto no Sistema de Recomendação**:
    - As alterações no perfil são imediatamente consideradas nas próximas solicitações de recomendação.
    - O algoritmo de recomendação recalcula os scores de compatibilidade com base nos novos dados do perfil.
    - Isso pode resultar em um novo conjunto de matches mais alinhados com as informações atualizadas do usuário.

## 4. Considerações Importantes

- **Consistência de Dados**: É crucial garantir que as atualizações do frontend sejam corretamente refletidas no backend e no banco de dados para manter a integridade dos dados do usuário.
- **Feedback Visual**: O frontend deve fornecer feedback claro ao usuário sobre o sucesso ou falha da atualização.
- **Re-cálculo de Recomendações**: Após uma atualização significativa do perfil (especialmente preferências de estilo), o sistema deve estar preparado para gerar novas recomendações que reflitam essas mudanças.
