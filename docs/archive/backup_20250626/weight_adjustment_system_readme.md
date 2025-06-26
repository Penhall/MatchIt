# 🎯 Sistema de Ajuste Automático de Pesos - Fase 2

## 📋 **VISÃO GERAL**

O Sistema de Ajuste Automático de Pesos é uma funcionalidade avançada que permite que o algoritmo de recomendação aprenda e se adapte automaticamente baseado no comportamento do usuário. O sistema monitora interações, identifica padrões e ajusta os pesos dos atributos de compatibilidade para melhorar a qualidade das recomendações ao longo do tempo.

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### **Componentes Principais:**

1. **FeedbackProcessor** - Processa e enriquece eventos de feedback
2. **WeightAdjustmentService** - Analisa padrões e aplica ajustes de pesos
3. **AdaptiveRecommendationEngine** - Gera recomendações com pesos adaptativos
4. **FeedbackTracker** - Componente React para tracking em tempo real
5. **WeightAdjustmentDashboard** - Dashboard para monitoramento

### **Fluxo de Funcionamento:**

```
Evento do Usuário → FeedbackTracker → FeedbackProcessor → Análise de Padrões → Ajuste de Pesos → Recomendações Melhoradas
```

---

## 📊 **TIPOS DE FEEDBACK MONITORADOS**

### **Eventos Positivos:**
- `swipe_right` - Curtida em perfil
- `super_like` - Super curtida
- `message_sent` - Mensagem enviada
- `match_created` - Match criado
- `conversation_started` - Conversa iniciada
- `date_planned` - Encontro marcado
- `date_completed` - Encontro realizado

### **Eventos Negativos:**
- `swipe_left` - Rejeição de perfil
- `match_dissolved` - Match desfeito
- `conversation_ended` - Conversa encerrada

### **Eventos Neutros:**
- `profile_view` - Visualização de perfil
- `profile_view_extended` - Visualização prolongada
- `message_received` - Mensagem recebida

---

## 🧠 **ALGORITMOS DE APRENDIZADO**

### **1. Análise de Performance por Atributo**
- Compara médias de atributos em eventos positivos vs negativos
- Identifica quais características levam a mais matches
- Ajusta pesos baseado na significância estatística

### **2. Detecção de Padrões Temporais**
- Analisa comportamento por hora do dia e dia da semana
- Identifica períodos de maior/menor seletividade
- Adapta recomendações baseado no contexto temporal

### **3. Influência do Humor**
- Correlaciona estado emocional com escolhas
- Ajusta pesos quando o usuário está em diferentes estados de humor
- Considera energia, estresse, felicidade, sociabilidade

### **4. Análise de Comportamento de Visualização**
- Tempo gasto visualizando perfis
- Correlação entre tempo de visualização e feedback
- Identifica sinais de hesitação ou interesse

---

## ⚙️ **CONFIGURAÇÕES ADAPTÁVEIS**

### **Parâmetros do Usuário:**
- **adaptationRate** (0.1-0.9): Velocidade de adaptação
- **minConfidenceThreshold** (0.1-0.95): Confiança mínima para aplicar ajustes
- **maxWeightChange** (0.05-0.5): Mudança máxima por ajuste
- **temporalAdaptation** (boolean): Ativar adaptação temporal
- **moodAdaptation** (boolean): Ativar adaptação por humor
- **learningEnabled** (boolean): Ativar aprendizado automático

### **Pesos dos Atributos:**
```javascript
{
  age: 0.15,                    // Importância da idade
  location: 0.20,               // Importância da localização
  interests: 0.25,              // Importância dos interesses
  lifestyle: 0.10,              // Importância do estilo de vida
  values: 0.15,                 // Importância dos valores
  appearance: 0.05,             // Importância da aparência
  personality: 0.05,            // Importância da personalidade
  communication: 0.03,          // Importância do estilo de comunicação
  goals: 0.02,                  // Importância dos objetivos
  emotionalIntelligence: 0.00,  // Inteligência emocional
  humor: 0.00,                  // Senso de humor
  creativity: 0.00              // Criatividade
}
```

---

## 📱 **IMPLEMENTAÇÃO NO FRONTEND**

### **Usando o FeedbackTracker:**

```typescript
import FeedbackTracker, { useFeedbackTracker } from '@/components/profile/FeedbackTracker';

// Em um componente de perfil
const ProfileCard = ({ user, currentUser }) => {
  const {
    recordSwipeRight,
    recordSwipeLeft,
    recordSuperLike,
    updatePosition,
    getCurrentMetrics
  } = useFeedbackTracker(currentUser.id, user.id);

  const handleSwipeRight = () => {
    recordSwipeRight();
    // Lógica do swipe...
  };

  return (
    <div className="relative">
      <FeedbackTracker
        userId={currentUser.id}
        targetUserId={user.id}
        screenType="discovery"
        profileData={{
          matchScore: user.matchScore,
          reasonsForRecommendation: user.reasons
        }}
      />
      {/* Conteúdo do perfil... */}
    </div>
  );
};
```

### **Usando o Context Provider:**

```typescript
import { FeedbackTrackingProvider } from '@/components/profile/FeedbackTracker';

// No componente raiz da aplicação
const App = () => {
  return (
    <FeedbackTrackingProvider userId={currentUser.id}>
      <AppContent />
    </FeedbackTrackingProvider>
  );
};
```

---

## 🔌 **API ENDPOINTS**

### **Registrar Feedback:**
```http
POST /api/profile/weight-adjustment/feedback
Content-Type: application/json

{
  "eventType": "swipe_right",
  "targetUserId": "uuid",
  "timeSpentViewing": 5.2,
  "userMood": {
    "happiness": 0.8,
    "energy": 0.6
  }
}
```

### **Obter Análise de Ajustes:**
```http
GET /api/profile/weight-adjustment/analysis?timeWindow=7%20days
```

### **Aplicar Ajustes Automáticos:**
```http
POST /api/profile/weight-adjustment/apply
```

### **Obter Analytics:**
```http
GET /api/profile/weight-adjustment/analytics?period=daily&days=30
```

### **Configurar Sistema:**
```http
PUT /api/profile/weight-adjustment/config
Content-Type: application/json

{
  "adaptationRate": 0.3,
  "temporalAdaptation": true,
  "moodAdaptation": true
}
```

---

## 📈 **DASHBOARD DE MONITORAMENTO**

### **Métricas Disponíveis:**

1. **Taxa de Sucesso** - Percentual de eventos positivos
2. **Qualidade Média** - Score médio de compatibilidade
3. **Eventos por Dia** - Volume de interações
4. **Ajustes Aplicados** - Quantidade de otimizações

### **Visualizações:**

- **Gráfico de Tendência** - Performance ao longo do tempo
- **Comparação de Pesos** - Valores atuais vs originais
- **Histórico de Ajustes** - Log de mudanças com confiança
- **Configurações** - Controles de adaptação

---

## 🔧 **CONFIGURAÇÃO E INSTALAÇÃO**

### **1. Executar Migração:**
```sql
-- Executar arquivo: server/migrations/add_feedback_tracking_20250624.sql
```

### **2. Configurar Serviços:**
```javascript
// No seu app.js principal
const AdaptiveRecommendationEngine = require('./services/recommendation/adaptive-recommendation-engine');
const adaptiveEngine = new AdaptiveRecommendationEngine();

// Usar para gerar recomendações
const recommendations = await adaptiveEngine.generateAdaptiveRecommendations(userId, {
  limit: 10,
  includeExploration: true
});
```

### **3. Adicionar Rotas:**
```javascript
// Em server/app.js
app.use('/api/profile', require('./routes/profile'));
```

---

## 🎯 **ESTRATÉGIAS DE OTIMIZAÇÃO**

### **Diversificação:**
- **Fator de Diversidade**: 15% das recomendações focam em variedade
- **Exploração vs Exploração**: 10% para descobrir novos padrões
- **Anti-Echo Chamber**: Evita recomendações muito similares

### **Contextualização:**
- **Temporal**: Adapta baseado no horário/dia
- **Humoral**: Considera estado emocional
- **Sessional**: Ajusta durante a sessão de uso

### **Aprendizado Contínuo:**
- **Feedback Loop**: Cada interação melhora o sistema
- **Padrão Recognition**: Identifica mudanças de preferência
- **A/B Testing**: Testa diferentes abordagens automaticamente

---

## 📊 **MÉTRICAS DE PERFORMANCE**

### **KPIs do Sistema:**

1. **Precision@10**: Precisão das top 10 recomendações
2. **Recall Rate**: Taxa de recall dos matches
3. **Engagement Rate**: Taxa de interação prolongada
4. **Satisfaction Score**: Score de satisfação do usuário
5. **Learning Velocity**: Velocidade de adaptação
6. **Consistency Score**: Consistência das preferências

### **Monitoramento:**
```javascript
// Obter estatísticas do sistema
const stats = await weightAdjustmentService.getSystemPerformanceStats();

/*
{
  active_users: 1250,
  total_adjustments: 8942,
  avg_confidence: 0.73,
  high_confidence_adjustments: 6518,
  recent_adjustments: 156
}
*/
```

---

## 🚀 **PRÓXIMOS PASSOS**

### **Fase 3: Métricas e Analytics** (Próxima)
- Dashboard avançado de analytics
- Relatórios de performance
- Comparações A/B automáticas
- Alertas de anomalias

### **Fase 4: Performance e Otimização**
- Cache distribuído
- Processamento paralelo
- Otimização de queries
- Escalabilidade horizontal

---

## 🔍 **DEBUGGING E TROUBLESHOOTING**

### **Logs Importantes:**
```bash
# Verificar ajustes automáticos
grep "Auto-adjustment applied" logs/app.log

# Monitorar performance
grep "Error in background" logs/app.log

# Verificar padrões detectados
grep "Pattern detected" logs/app.log
```

### **Queries de Diagnóstico:**
```sql
-- Verificar eventos recentes
SELECT event_type, COUNT(*) 
FROM feedback_events 
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY event_type;

-- Ver ajustes por usuário
SELECT user_id, COUNT(*), AVG(confidence_score)
FROM weight_adjustments 
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY COUNT(*) DESC;
```

---

## 📚 **RECURSOS ADICIONAIS**

- **Documentação da API**: `/docs/api-reference.md`
- **Guia de Desenvolvimento**: `/docs/development-guide.md`
- **Exemplos de Uso**: `/examples/weight-adjustment/`
- **Testes**: `/tests/weight-adjustment/`

---

## 🤝 **CONTRIBUINDO**

Para contribuir com melhorias no sistema:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Teste** thoroughly com dados reais
4. **Documente** mudanças na API
5. **Submit** pull request com descrição detalhada

---

**🎯 O Sistema de Ajuste Automático de Pesos representa um grande avanço na personalização das recomendações, permitindo que o algoritmo evolua continuamente baseado no comportamento real dos usuários.**