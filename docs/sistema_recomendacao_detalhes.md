# Sistema de Recomendação: Proposta, Implementação e Fluxo

## 1. Proposta Original

A proposta do sistema de recomendação, conforme descrito em `Recomendacao -Texto1.md`, era:
- Implementar algoritmo híbrido combinando múltiplas dimensões de compatibilidade
- Criar perfil de usuário com dados de estilo e preferências
- Estabelecer conexão eficiente entre frontend e backend
- Implementar sistema de aprendizado adaptativo
- Garantir performance com cache e otimizações

## 2. Implementação Atual

### 2.1 Ajustes de Estilo do Usuário
- **Frontend**: Tela de ajuste de estilo (`screens/StyleAdjustmentScreen.tsx`)
  - Usuário seleciona preferências em tênis, roupas, cores, hobbies e sentimentos
  - Interface visual com seleção por cards e sliders
- **Armazenamento**: 
  - Dados salvos em `stylePreferences` (interface `UserProfile` em `types/recommendation.ts`)
  - Estrutura JSONB no PostgreSQL (tabela `user_profiles`)

```typescript
// Exemplo de estrutura de dados (types/recommendation.ts)
interface StylePreferences {
  tenis: number[];
  roupas: number[];
  cores: number[];
  hobbies: number[];
  sentimentos: number[];
}
```

### 2.2 Dados do Perfil
- **Campos implementados**:
  - Dados básicos (idade, gênero, localização)
  - Preferências de estilo (`stylePreferences`)
  - Preferências de busca (`preferences.ageRange`, `preferences.maxDistance`)
  - Personalidade parcial (`personalityVector`)
- **Campos faltando**:
  - Perfil emocional completo (`emotionalProfile`)
  - Nível de atividade (`activityLevel`)

### 2.3 Conexão Frontend-Backend
1. Frontend usa hook `useApi` (arquivo `hooks/useApi.ts`)
2. Chamadas API para endpoints em `routes/recommendation/recommendations.ts`:
   - `GET /api/recommendations`: Obtém recomendações
   - `POST /api/recommendations/feedback`: Envia feedback
3. Fluxo de dados:
   ```mermaid
   sequenceDiagram
       Frontend->>Backend: POST /login (autenticação)
       Backend-->>Frontend: JWT token
       Frontend->>Backend: GET /api/recommendations (com JWT)
       Backend->>Database: Busca candidatos
       Backend->>RecommendationService: Calcula scores
       Backend-->>Frontend: Lista de matches
       Frontend->>Backend: POST feedback (like/dislike)
   ```

## 3. Fluxo de Execução

1. **Coleta de dados**:
   - Usuário completa ajustes de estilo no frontend
   - Dados salvos via API no backend
   
2. **Geração de recomendações**:
   - Frontend solicita matches via `GET /api/recommendations`
   - Backend aplica algoritmo híbrido:
     - Filtra candidatos por localização/preferências
     - Calcula compatibilidade de estilo (Jaccard)
     - Calcula score de localização (exponencial)
     - Combina scores com pesos configuráveis

3. **Feedback e aprendizado**:
   - Usuário envia feedback via frontend
   - Sistema registra interação para ajuste futuro

## 4. Possíveis Erros

### 4.1 Fluxo de Estilo
- **Erro**: Dados de estilo não salvos corretamente
  - **Causa**: Validação faltando no endpoint de salvamento
  - **Solução**: Adicionar validação de schema no backend

- **Erro**: Estilos não refletidos nas recomendações
  - **Causa**: Cálculo de similaridade não aplicado
  - **Solução**: Verificar implementação em `match-score.ts`

### 4.2 Conexão Frontend-Backend
- **Erro**: Timeout ao buscar recomendações
  - **Causa**: Limite de candidatos muito alto
  - **Solução**: Otimizar queries com índices espaciais

- **Erro**: Dados inconsistentes entre telas
  - **Causa**: Cache desatualizado no frontend
  - **Solução**: Implementar revalidação de cache

### 4.3 Problemas Gerais
- **Cold start**: Novos usuários recebem recomendações pobres
  - **Solução**: Implementar fallback para filtragem baseada em conteúdo
- **Viés algorítmico**: Recomendações limitadas a perfis similares
  - **Solução**: Adicionar aleatoriedade controlada

## 5. Próximos Passos

1. Completar implementação do perfil emocional
2. Adicionar sistema de ajuste automático de pesos
3. Implementar lazy loading para melhor performance
4. Adicionar testes E2E para fluxo completo
5. Desenvolver dashboard de monitoramento
