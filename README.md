# 🎯 Sistema de Recomendação MatchIt

> **Status**: 🟢 **75% IMPLEMENTADO** - Funcionalmente completo para uso básico

Sistema inteligente de recomendações que conecta pessoas baseado em compatibilidade de estilo, personalidade, localização e comportamento.

## 📋 Índice

- [Status Atual](#-status-atual)
- [Arquitetura](#-arquitetura)
- [Configuração](#%EF%B8%8F-configuração)
- [Como Usar](#-como-usar)
- [APIs Disponíveis](#-apis-disponíveis)
- [Banco de Dados](#-banco-de-dados)
- [Tipos TypeScript](#-tipos-typescript)
- [Algoritmos](#-algoritmos)
- [Próximos Passos](#-próximos-passos)

## 🎯 Status Atual

### ✅ IMPLEMENTADO
- **Backend Completo**: Serviços, APIs, cache, rate limiting
- **Database Schema**: 17 tabelas + 7 stored procedures + 3 views
- **Tipos TypeScript**: Sistema completo de tipagem
- **3 Algoritmos**: Híbrido, Colaborativo, Baseado em Conteúdo
- **Aprendizado Automático**: Pesos adaptativos baseados em feedback
- **Analytics Detalhados**: Métricas de engajamento e performance

### ⚠️ PENDENTE
- **Componentes React**: Frontend components
- **Integração Final**: Conectar com server.js existente
- **Testes**: Validação completa do sistema

---

## 🏗️ Arquitetura

```
📁 Sistema de Recomendação
├── 🧠 Engine Core (RecommendationService)
├── 📊 Analytics & Learning
├── 🗄️ Database (PostgreSQL)
├── 🔌 REST APIs
├── 🧩 TypeScript Types
└── ⚡ Cache & Performance
```

### Fluxo Principal
1. **Usuário** solicita recomendações
2. **API** valida e processa request
3. **Engine** calcula compatibilidades 
4. **Algoritmo** seleciona melhores matches
5. **Cache** otimiza performance
6. **Analytics** registra métricas
7. **Learning** ajusta pesos automaticamente

---

## ⚙️ Configuração

### 1. Executar Migrations do Banco

```bash
# Executar migrations em ordem
psql -U matchit -d matchit_db -f scripts/migration_001_core_tables.sql
psql -U matchit -d matchit_db -f scripts/migration_002_analytics_tables.sql
psql -U matchit -d matchit_db -f scripts/migration_003_stored_procedures.sql
psql -U matchit -d matchit_db -f scripts/migration_004_views_config.sql
```

### 2. Configurar Variáveis de Ambiente

```bash
# Configurações do Sistema de Recomendação
RECOMMENDATION_ALGORITHM=hybrid
RECOMMENDATION_CACHE_TTL=1800
MAX_CANDIDATES=200

# Pesos padrão do algoritmo
DEFAULT_STYLE_WEIGHT=0.25
DEFAULT_EMOTIONAL_WEIGHT=0.20
DEFAULT_HOBBY_WEIGHT=0.20
DEFAULT_LOCATION_WEIGHT=0.15
DEFAULT_PERSONALITY_WEIGHT=0.20

# Performance e Cache
ENABLE_CACHE=true
ENABLE_ANALYTICS=true
MAX_RECOMMENDATIONS_PER_REQUEST=50
```

### 3. Integrar com Server.js

```javascript
// server.js
import { createRecommendationRoutes } from './routes/recommendation/recommendations.js';

// Adicionar rotas
app.use('/api/recommendations', createRecommendationRoutes(pool));
```

---

## 🚀 Como Usar

### Exemplo Básico - Obter Recomendações

```javascript
// Frontend/React
const response = await fetch('/api/recommendations?limit=20&algorithm=hybrid', {
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});

const { data } = await response.json();
console.log('Recomendações:', data.recommendations);
```

### Registrar Feedback

```javascript
// Usuário curtiu um perfil
await fetch('/api/recommendations/feedback', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUserId: 'user-uuid',
    action: 'like',
    context: {
      viewTime: 5000,
      scrollDepth: 0.8,
      photosViewed: 3
    }
  })
});
```

---

## 🔌 APIs Disponíveis

### GET `/api/recommendations`
Obter recomendações personalizadas

**Parâmetros:**
- `limit` (1-50): Número de recomendações
- `algorithm`: `hybrid` | `collaborative` | `content`
- `refresh`: `true` para forçar atualização
- `ageMin`, `ageMax`: Filtro de idade
- `maxDistance`: Distância máxima em km
- `verifiedOnly`: Apenas usuários verificados

### POST `/api/recommendations/feedback`
Registrar feedback do usuário

**Body:**
```json
{
  "targetUserId": "uuid",
  "action": "like|dislike|super_like|skip|report|block",
  "context": {
    "viewTime": 5000,
    "scrollDepth": 0.8,
    "photosViewed": 3
  }
}
```

### GET `/api/recommendations/stats`
Estatísticas do usuário

### PUT `/api/recommendations/preferences`
Atualizar preferências do algoritmo

### GET `/api/recommendations/health`
Health check do sistema

---

## 🗄️ Banco de Dados

### Tabelas Principais

#### Core System
- `user_extended_profiles` - Perfis psicológicos e comportamentais
- `user_algorithm_weights` - Pesos personalizados por usuário
- `user_interactions` - Histórico de likes/dislikes
- `match_scores` - Scores de compatibilidade calculados
- `recommendation_sessions` - Sessões de recomendação

#### Analytics
- `analytics_events` - Eventos detalhados para tracking
- `user_behavior_patterns` - Padrões comportamentais identificados
- `engagement_metrics` - Métricas de engajamento por período
- `algorithm_performance` - Performance dos algoritmos
- `system_statistics` - Estatísticas agregadas

### Stored Procedures Principais

```sql
-- Calcular compatibilidade geral
SELECT calculate_overall_compatibility('user1_uuid', 'user2_uuid', 'hybrid');

-- Encontrar matches potenciais
SELECT * FROM find_potential_matches('user_uuid', 20, 0.3, 50.0);

-- Registrar interação com aprendizado
SELECT record_interaction_with_learning('user_uuid', 'target_uuid', 'like');
```

---

## 🧩 Tipos TypeScript

### Estrutura Principal

```typescript
import {
  // Tipos base
  RecommendationAlgorithm,
  CompatibilityDimensions,
  RecommendationResult,
  
  // Perfil estendido
  ExtendedUserProfile,
  PersonalityProfile,
  EmotionalProfile,
  
  // Scoring
  MatchScore,
  MatchExplanation,
  
  // Interações
  UserInteraction,
  InteractionContext,
  
  // Analytics
  EngagementMetrics,
  BehaviorPattern
} from './types/recommendation';
```

### Exemplo de Uso

```typescript
// Configurar algoritmo
const weights: CompatibilityDimensions = {
  style: 0.3,
  emotional: 0.2,
  hobby: 0.2,
  location: 0.15,
  personality: 0.15,
  lifestyle: 0.0,
  values: 0.0,
  communication: 0.0
};

// Processar resultado
const result: RecommendationResult = await getRecommendations(userId, {
  algorithm: 'hybrid',
  limit: 20,
  filters: { verifiedOnly: true }
});
```

---

## 🧠 Algoritmos

### 1. Híbrido (Recomendado)
Combina múltiplas dimensões com pesos personalizados:
- **Estilo** (25%): Similaridade em escolhas visuais
- **Emocional** (20%): Compatibilidade emocional
- **Hobbies** (20%): Interesses comuns
- **Localização** (15%): Proximidade geográfica
- **Personalidade** (20%): Match psicológico

### 2. Colaborativo
Baseado em comportamento de usuários similares:
- Identifica usuários com padrões semelhantes
- Recomenda baseado em curtidas de usuários similares
- Melhora com volume de dados

### 3. Baseado em Conteúdo
Foca nas características do perfil:
- Analisa preferências declaradas
- Ideal para novos usuários
- Menos dependente de dados históricos

### Sistema de Aprendizado
- **Feedback Positivo**: Aumenta peso das dimensões que contribuíram
- **Feedback Negativo**: Diminui levemente os pesos
- **Adaptação Gradual**: Ajustes pequenos para estabilidade
- **Confiança Crescente**: Melhora com mais interações

---

## 🎯 Próximos Passos

### Imediato (1-2 horas)
1. **Conectar rotas** no server.js principal
2. **Testar endpoints** com dados reais
3. **Validar integração** com banco existente

### Curto Prazo (1 semana)
1. **Criar componentes React**:
   ```bash
   # Componentes necessários
   components/recommendation/RecommendationCard.tsx
   components/recommendation/RecommendationList.tsx
   hooks/useRecommendations.ts
   ```

2. **Integrar com telas existentes**:
   - MatchAreaScreen usar recomendações reais
   - Adicionar feedback de usuário
   - Exibir explicações de compatibilidade

### Médio Prazo (1 mês)
1. **Otimizações de Performance**:
   - Cache distribuído (Redis)
   - Otimização de queries
   - Paralelização de cálculos

2. **Analytics Avançados**:
   - Dashboard de métricas
   - Relatórios de performance
   - A/B testing framework

3. **Features Sociais**:
   - Matches mútuos aprimorados
   - Gamificação avançada
   - Recomendações baseadas em rede social

---

## 📊 Métricas de Performance

### Configuração Padrão
- **Cache TTL**: 30 minutos
- **Rate Limit**: 100 requests/hora por usuário
- **Max Candidates**: 200 perfis analisados
- **Processing Timeout**: 5 segundos
- **Min Compatibility**: 30% para recomendação

### Monitoramento
- Tempo de resposta médio
- Taxa de acerto do cache
- Taxa de erro
- Satisfação do usuário
- Taxa de conversão (like → match → conversa)

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. "Função não encontrada"
```bash
# Verificar se migrations foram executadas
psql -U matchit -d matchit_db -c "\df"
```

#### 2. "Rate limit exceeded"
```javascript
// Aguardar ou aumentar limite no código
const rateLimitInfo = response.headers['x-ratelimit-remaining'];
```

#### 3. "Nenhuma recomendação encontrada"
```sql
-- Verificar dados básicos
SELECT COUNT(*) FROM users WHERE is_active = true;
SELECT COUNT(*) FROM user_extended_profiles;
```

### Debug Mode
```bash
# Ativar logs detalhados
export RECOMMENDATION_DEBUG=true
export LOG_LEVEL=debug
```

---

## 📝 Licença

Este sistema é parte do projeto MatchIt e segue a licença do projeto principal.

---

## 🤝 Contribuição

Para contribuir com o sistema de recomendação:

1. Entender a arquitetura atual
2. Executar testes locais
3. Seguir padrões de tipagem TypeScript
4. Documentar mudanças
5. Validar performance

---

**🚀 O Sistema de Recomendação MatchIt está pronto para transformar conexões em relacionamentos significativos!**

*Última atualização: 09 de junho de 2025*