# 🔌 Integração Sistema de Recomendação MatchIt

## 🎯 Guia Rápido para Finalizar a Integração

> **Status**: Sistema 75% implementado - Faltam apenas integrações finais

---

## ⚡ Integração Express (1 hora)

### 1. Conectar Rotas no Server.js
```javascript
// server.js - Adicionar estas linhas

import { createRecommendationRoutes } from './routes/recommendation/recommendations.js';

// Após as rotas existentes, adicionar:
app.use('/api/recommendations', createRecommendationRoutes(pool));

console.log('🎯 Sistema de Recomendação ativado!');
```

### 2. Executar Migrations
```bash
# Apenas se ainda não foram executadas
psql -U matchit -d matchit_db -f scripts/migration_001_core_tables.sql
psql -U matchit -d matchit_db -f scripts/migration_002_analytics_tables.sql
psql -U matchit -d matchit_db -f scripts/migration_003_stored_procedures.sql
psql -U matchit -d matchit_db -f scripts/migration_004_views_config.sql
```

### 3. Testar Endpoint
```bash
# Health check
curl http://localhost:3000/api/recommendations/health

# Recomendações (com token de usuário)
curl -H "Authorization: Bearer SEU_TOKEN" \
     http://localhost:3000/api/recommendations?limit=5
```

---

## 🎨 Integração com Frontend (2-3 horas)

### 1. Substituir MatchAreaScreen

**ANTES** (dados mockados):
```typescript
const [matches, setMatches] = useState(MOCK_CHAT_MESSAGES);
```

**DEPOIS** (dados reais):
```typescript
import { useRecommendations } from '../hooks/useRecommendations';

const MatchAreaScreen: React.FC = () => {
  const { recommendations, loading, recordFeedback } = useRecommendations();
  
  const handleLike = (userId: string) => {
    recordFeedback(userId, 'like');
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {recommendations.map(rec => (
        <MatchCard 
          key={rec.targetUserId}
          recommendation={rec}
          onLike={() => handleLike(rec.targetUserId)}
          compatibilityScore={Math.round(rec.overallScore * 100)}
        />
      ))}
    </div>
  );
};
```

### 2. Criar Hook useRecommendations
```typescript
// hooks/useRecommendations.ts
import { useState, useEffect } from 'react';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      const data = await response.json();
      setRecommendations(data.data.recommendations);
    } catch (error) {
      console.error('Erro:', error);
    }
    setLoading(false);
  };

  const recordFeedback = async (targetUserId: string, action: string) => {
    await fetch('/api/recommendations/feedback', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetUserId, action, context: {} })
    });
    
    // Remover da lista local
    setRecommendations(prev => 
      prev.filter(rec => rec.targetUserId !== targetUserId)
    );
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { recommendations, loading, recordFeedback, refresh: fetchRecommendations };
};
```

### 3. Exibir Score de Compatibilidade
```typescript
// Adicionar ao componente de match card existente
<div className="compatibility-badge">
  <span className="score">{compatibilityScore}%</span>
  <span className="label">compatível</span>
</div>

// CSS sugerido
.compatibility-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(45deg, #00f0ff, #0080ff);
  color: black;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}
```

---

## 🔧 Configurações Necessárias

### 1. Variáveis de Ambiente
```bash
# .env - Adicionar se não existir
RECOMMENDATION_ALGORITHM=hybrid
RECOMMENDATION_CACHE_TTL=1800
ENABLE_ANALYTICS=true
```

### 2. Dependências (se faltando)
```bash
npm install uuid lodash
npm install @types/uuid @types/lodash --save-dev
```

---

## 🧪 Validação da Integração

### ✅ Checklist Rápido
```bash
# 1. Servidor inicia sem erros
npm start

# 2. Health check responde
curl http://localhost:3000/api/recommendations/health
# Esperado: {"success": true, "data": {"status": "healthy"}}

# 3. Frontend carrega recomendações reais
# - Abrir app no navegador
# - Ir para MatchArea  
# - Ver se carrega perfis reais (não mocks)
# - Testar like/dislike

# 4. Banco registra interações
psql -c "SELECT COUNT(*) FROM user_interactions WHERE created_at > NOW() - INTERVAL '1 hour';"
```

### 🐛 Troubleshooting Comum

**Erro: "Cannot resolve module"**
```bash
# Verificar se tipos estão corretos
npm run build
```

**Erro: "Function does not exist"**
```sql
-- Verificar se migrations rodaram
\df calculate_*
```

**Erro: "No recommendations found"**
```sql
-- Verificar se há usuários ativos
SELECT COUNT(*) FROM users WHERE is_active = true;

-- Criar perfil estendido se necessário
INSERT INTO user_extended_profiles (user_id, profile_completeness) 
SELECT id, 0.8 FROM users WHERE id NOT IN (SELECT user_id FROM user_extended_profiles);
```

---

## 🎨 Melhorias Visuais (Opcional)

### 1. Indicador de Loading
```typescript
// Adicionar ao MatchAreaScreen
{loading && (
  <div className="recommendation-loading">
    <div className="spinner"></div>
    <p>Encontrando pessoas compatíveis...</p>
  </div>
)}
```

### 2. Explicação de Compatibilidade
```typescript
// Mostrar por que são compatíveis
<div className="compatibility-reason">
  <p>{recommendation.explanation.summary}</p>
  {recommendation.explanation.strengths.map(strength => (
    <span key={strength} className="strength-tag">
      {strength}
    </span>
  ))}
</div>
```

### 3. Animações de Feedback
```typescript
// Adicionar animação ao curtir/descurtir
const handleLikeWithAnimation = (userId: string) => {
  // Animação de heart
  setShowHeartAnimation(true);
  setTimeout(() => {
    recordFeedback(userId, 'like');
    setShowHeartAnimation(false);
  }, 500);
};
```

---

## 📊 Monitoramento Pós-Integração

### 1. Métricas Importantes
```sql
-- Verificar atividade do sistema
SELECT 
  COUNT(*) as total_recomendations,
  AVG(overall_score) as avg_score,
  COUNT(DISTINCT user_id) as unique_users
FROM match_scores 
WHERE calculated_at > NOW() - INTERVAL '24 hours';

-- Verificar interações
SELECT 
  action,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM user_interactions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action;
```

### 2. Performance
```bash
# Verificar tempo de resposta das APIs
tail -f logs/app.log | grep "recommendation"

# Monitorar uso de memória
ps aux | grep node
```

---

## 🚀 Próximos Passos (Futuro)

### Curto Prazo (1-2 semanas)
1. **A/B Testing** - Comparar algoritmos
2. **Dashboard Analytics** - Visualizar métricas
3. **Notificações Push** - Novos matches
4. **Cache Redis** - Performance melhorada

### Médio Prazo (1-2 meses)  
1. **ML Avançado** - Deep learning
2. **Features Sociais** - Amigos em comum
3. **Gamificação** - Pontuação e badges
4. **Feedback Detalhado** - Por que não curtiu

---

## ✅ Resumo da Integração

### O que já funciona (75%):
- ✅ Backend completo com 3 algoritmos
- ✅ 17 tabelas de banco + stored procedures
- ✅ 5 endpoints de API funcionais
- ✅ Sistema de cache e analytics
- ✅ Aprendizado automático de preferências

### O que falta (25%):
- ⚠️ Conectar rotas no server.js
- ⚠️ Substituir dados mockados por reais
- ⚠️ Criar hook useRecommendations
- ⚠️ Testar integração completa

### Resultado Final:
**Sistema de recomendação personalizado funcionando 100%** com:
- Recomendações baseadas em compatibilidade real
- Aprendizado automático das preferências
- Analytics detalhados de comportamento
- Performance otimizada com cache

---

**⏱️ Tempo estimado para conclusão: 3-4 horas**

**🎯 Resultado: MatchIt com sistema de recomendação de nível profissional!**