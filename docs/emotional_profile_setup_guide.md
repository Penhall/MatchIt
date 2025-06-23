# 🧠 Guia de Implementação do Perfil Emocional - Fase 1

Este documento fornece instruções completas para implementar a **Fase 1 - Perfil Emocional** no sistema MatchIt.

## 📋 Visão Geral

A implementação do Perfil Emocional adiciona uma nova dimensão ao sistema de recomendação híbrido, permitindo:

- ✅ Análise de compatibilidade emocional entre usuários
- ✅ Questionário emocional interativo e intuitivo
- ✅ Cálculo de scores emocionais integrado ao sistema existente
- ✅ Tracking de humor e padrões emocionais
- ✅ API completa para gerenciar perfis emocionais

## 🚀 Checklist de Implementação

### ✅ **Fase 1.1: Preparação do Ambiente**

```bash
# 1. Backup do código atual
git checkout -b backup-pre-emotional-profile
git push origin backup-pre-emotional-profile

# 2. Criar branch para implementação
git checkout main
git checkout -b feature/emotional-profile-phase1

# 3. Verificar dependências necessárias
npm install expo-linear-gradient @expo/vector-icons
```

### ✅ **Fase 1.2: Estrutura de Arquivos**

Criar a seguinte estrutura de pastas (se não existir):

```
project-root/
├── types/
│   └── recommendation-emotional.ts          ✅ NOVO
├── services/recommendation/
│   └── emotional-profile-service.ts         ✅ NOVO
├── recommendation/
│   └── emotional-match-calculator.ts        ✅ NOVO
├── screens/
│   └── EmotionalStyleAdjustmentScreen.tsx   ✅ EXPANDIDO
├── components/EmotionalQuestionnaire/
│   └── index.tsx                            ✅ NOVO
├── hooks/
│   └── useEmotionalProfile.ts               ✅ NOVO
├── routes/
│   └── emotional-profile.js                 ✅ NOVO
├── database/migrations/
│   └── 002_emotional_profile_schema.sql     ✅ NOVO
└── tests/
    └── emotional-profile.test.ts            ✅ NOVO
```

### ✅ **Fase 1.3: Implementação do Banco de Dados**

```sql
-- 1. Executar migração do esquema
psql -d matchit_db -f database/migrations/002_emotional_profile_schema.sql

-- 2. Verificar tabelas criadas
\dt emotional_*

-- 3. Testar funções auxiliares
SELECT calculate_profile_quality_score('test_profile_id');
```

### ✅ **Fase 1.4: Integração dos Types**

```typescript
// 1. Atualizar imports no sistema existente
// Em recommendation/match-score.ts:
import { 
  EnhancedMatchScore, 
  ExtendedUserProfile 
} from '../types/recommendation';

// 2. Verificar compatibilidade com interfaces existentes
// Execute: npm run type-check
```

### ✅ **Fase 1.5: Configuração da API**

```javascript
// 1. Adicionar rota ao app principal
// Em app.js ou server.js:
const emotionalProfileRoutes = require('./routes/emotional-profile');
app.use('/api/emotional-profile', emotionalProfileRoutes);

// 2. Verificar middleware de autenticação
// Certifique-se de que authMiddleware está funcionando

// 3. Testar endpoints básicos
curl -X GET http://localhost:3000/api/emotional-profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### ✅ **Fase 1.6: Implementação do Frontend**

```typescript
// 1. Atualizar tela de ajuste de estilo
// Substituir screens/StyleAdjustmentScreen.tsx por:
// screens/EmotionalStyleAdjustmentScreen.tsx

// 2. Adicionar hook aos componentes que precisam
import { useEmotionalProfile } from '../hooks/useEmotionalProfile';

const MyComponent = () => {
  const { profile, createProfile } = useEmotionalProfile(userId);
  // ...usar o hook
};

// 3. Integrar componentes de UI
import { EmotionalSlider, EmotionalOptionCard } from '../components/EmotionalQuestionnaire';
```

### ✅ **Fase 1.7: Atualização do Sistema de Scoring**

```typescript
// 1. Integrar nova dimensão emocional
// Em recommendation/match-score.ts, verificar se:
// - calculateEmotionalCompatibility() está sendo chamado
// - Pesos incluem a dimensão emocional (25%)
// - EnhancedMatchScore é retornado corretamente

// 2. Testar cálculo híbrido
const matchScore = MatchScoreCalculator.calculateMatchScore(
  userProfile,
  targetProfile
);
console.log('Emotional Score:', matchScore.dimensionScores.emotional);
```

## 🧪 Testes e Validação

### **Testes Unitários**

```bash
# Executar testes específicos do perfil emocional
npm test emotional-profile.test.ts

# Executar todos os testes
npm test

# Verificar cobertura
npm run test:coverage
```

### **Testes de Integração**

```bash
# 1. Testar criação de perfil
curl -X POST http://localhost:3000/api/emotional-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "responses": {
      "energy_energy_general": 75,
      "openness_openness_general": 80,
      "stability_emotional_stability": 70
    }
  }'

# 2. Testar compatibilidade
curl -X GET http://localhost:3000/api/emotional-profile/compatibility/TARGET_USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Testar entrada de humor
curl -X POST http://localhost:3000/api/emotional-profile/mood \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "mood": 75,
    "energy": 80,
    "stress": 30
  }'
```

### **Testes de Performance**

```javascript
// Script de teste de performance
const startTime = performance.now();

// Calcular 100 compatibilidades
for (let i = 0; i < 100; i++) {
  const compatibility = EmotionalProfileService.calculateEmotionalCompatibility(
    profile1, profile2
  );
}

const endTime = performance.now();
console.log(`Tempo médio por cálculo: ${(endTime - startTime) / 100}ms`);
// Deve ser < 10ms por cálculo
```

## ⚙️ Configurações Necessárias

### **Variáveis de Ambiente**

```bash
# .env
EMOTIONAL_PROFILE_CACHE_TTL=300000  # 5 minutos
EMOTIONAL_COMPATIBILITY_CACHE_DAYS=7
MIN_EMOTIONAL_COMPLETENESS=50
ENABLE_EMOTIONAL_MATCHING=true
EMOTIONAL_PROFILE_UPDATE_INTERVAL_DAYS=90
```

### **Configurações do Sistema**

```sql
-- Inserir configurações padrão
INSERT INTO system_config (key, value, description) VALUES 
('emotional_matching_weight', '0.25', 'Peso da dimensão emocional no algoritmo híbrido'),
('emotional_profile_min_questions', '20', 'Mínimo de perguntas para perfil válido'),
('emotional_compatibility_threshold', '60', 'Score mínimo para considerar compatível')
ON CONFLICT (key) DO NOTHING;
```

## 📊 Monitoramento e Métricas

### **KPIs Importantes**

1. **Taxa de Completude de Perfis Emocionais**
   ```sql
   SELECT 
     AVG(completeness) as avg_completeness,
     COUNT(*) as total_profiles
   FROM emotional_profiles 
   WHERE is_active = true;
   ```

2. **Distribuição de Compatibilidades**
   ```sql
   SELECT 
     CASE 
       WHEN overall_score >= 80 THEN 'Alta'
       WHEN overall_score >= 60 THEN 'Média'
       ELSE 'Baixa'
     END as compatibility_level,
     COUNT(*) as count
   FROM emotional_compatibilities
   GROUP BY compatibility_level;
   ```

3. **Uso do Sistema de Humor**
   ```sql
   SELECT 
     DATE(timestamp) as date,
     COUNT(*) as mood_entries,
     AVG(mood) as avg_mood
   FROM mood_entries
   WHERE timestamp > NOW() - INTERVAL '30 days'
   GROUP BY DATE(timestamp)
   ORDER BY date;
   ```

### **Alertas e Logs**

```javascript
// Configurar logging específico
const emotionalLogger = require('winston').createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'emotional-profile' },
  transports: [
    new winston.transports.File({ filename: 'logs/emotional-profile.log' })
  ]
});

// Alertas para problemas
if (profileCompleteness < 50) {
  emotionalLogger.warn('Low emotional profile completeness', { 
    userId, 
    completeness: profileCompleteness 
  });
}
```

## 🔄 Processo de Deploy

### **Staging**

```bash
# 1. Deploy para staging
git push origin feature/emotional-profile-phase1

# 2. Executar migração em staging
heroku pg:psql -a matchit-staging < database/migrations/002_emotional_profile_schema.sql

# 3. Testar funcionalidades críticas
npm run test:integration:staging

# 4. Verificar performance
npm run test:performance:staging
```

### **Produção**

```bash
# 1. Merge após aprovação
git checkout main
git merge feature/emotional-profile-phase1

# 2. Tag da release
git tag -a v1.1.0-emotional-profile -m "Implementação Perfil Emocional Fase 1"

# 3. Deploy com zero downtime
# Executar migração primeiro (backward compatible)
heroku pg:psql -a matchit-prod < database/migrations/002_emotional_profile_schema.sql

# 4. Deploy da aplicação
git push heroku main

# 5. Verificar health checks
curl -X GET https://api.matchit.com/api/health
```

## 🚨 Troubleshooting

### **Problemas Comuns**

1. **Erro: "EmotionalProfile type not found"**
   ```bash
   # Solução: Verificar imports
   npm run type-check
   # Verificar se recommendation-emotional.ts está sendo importado corretamente
   ```

2. **Erro: "emotional_profiles table does not exist"**
   ```sql
   -- Solução: Executar migração
   \i database/migrations/002_emotional_profile_schema.sql
   ```

3. **Performance lenta nos cálculos**
   ```javascript
   // Solução: Verificar cache
   const cacheStats = await redis.info('memory');
   console.log('Cache stats:', cacheStats);
   ```

4. **Frontend não carrega questionário**
   ```bash
   # Solução: Verificar dependências
   npm install expo-linear-gradient @expo/vector-icons
   npx expo install --fix
   ```

### **Logs para Debug**

```bash
# Backend logs
tail -f logs/emotional-profile.log | grep ERROR

# Database logs
tail -f /var/log/postgresql/postgresql.log | grep emotional

# Frontend logs (React Native)
npx react-native log-android  # ou log-ios
```

## ✅ Critérios de Aceitação

### **Funcionalidades Implementadas**

- [ ] ✅ Usuário pode completar questionário emocional
- [ ] ✅ Sistema calcula compatibilidade emocional
- [ ] ✅ Score emocional integrado ao sistema híbrido
- [ ] ✅ API de perfil emocional funcional
- [ ] ✅ Tracking de humor implementado
- [ ] ✅ Tela de ajuste expandida funcionando
- [ ] ✅ Cache de compatibilidades funcionando
- [ ] ✅ Validações e testes passando

### **Performance Aceitável**

- [ ] ✅ Cálculo de compatibilidade < 100ms
- [ ] ✅ Questionário carrega em < 2s
- [ ] ✅ API responde em < 500ms
- [ ] ✅ Cache hit rate > 80%

### **Qualidade de Código**

- [ ] ✅ Cobertura de testes > 85%
- [ ] ✅ Sem erros de TypeScript
- [ ] ✅ Linting passes
- [ ] ✅ Documentação atualizada

## 🎯 Próximos Passos (Fases Futuras)

### **Fase 2: Ajuste Automático de Pesos**
- Implementar algoritmo de aprendizado adaptativo
- Dashboard de monitoramento de pesos
- Personalização baseada em feedback

### **Fase 3: Lazy Loading**
- Paginação de recomendações
- Scroll infinito otimizado
- Cache inteligente

### **Fase 4: Algoritmo Colaborativo**
- Filtragem baseada em usuários similares
- Clustering de perfis emocionais
- Recomendações sociais

## 📞 Suporte

### **Contatos da Equipe**
- **Tech Lead**: Responsável pela arquitetura
- **Backend Developer**: APIs e banco de dados
- **Frontend Developer**: React Native e UI
- **QA Engineer**: Testes e validação

### **Recursos Úteis**
- 📖 [Documentação da API](./API_DOCUMENTATION.md)
- 🧪 [Guia de Testes](./TESTING_GUIDE.md)
- 🏗️ [Arquitetura do Sistema](./ARCHITECTURE.md)
- 🚀 [Deploy Guide](./DEPLOY_GUIDE.md)

---

**Status**: ✅ **IMPLEMENTAÇÃO COMPLETA - FASE 1**

A Fase 1 do Perfil Emocional está pronta para implementação e integração com o sistema MatchIt existente.