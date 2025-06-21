# Especificação da API de Recomendação com Módulo Emocional

## Endpoints Emocionais

### POST /emotional/feedback
Registra feedback emocional do usuário

**Parâmetros:**
- `userId` (number, obrigatório): ID do usuário
- `valence` (number, obrigatório): Valência emocional (-1 a 1)
- `arousal` (number, obrigatório): Nível de ativação (0 a 1)  
- `dominance` (number, obrigatório): Nível de controle (0 a 1)
- `description` (string, opcional): Descrição textual do estado
- `source` (string, opcional): Fonte do dado ('self_report', 'biometric' ou 'inferred')

**Exemplo de Request:**
```json
{
  "userId": 123,
  "valence": 0.7,
  "arousal": 0.5,
  "dominance": 0.8,
  "description": "Estou me sentindo bem hoje",
  "source": "self_report"
}
```

**Respostas:**
- 200: Feedback registrado com sucesso
- 400: Dados inválidos
- 500: Erro interno

### GET /emotional/profile/:userId
Obtém perfil emocional do usuário (versão V2)

**Parâmetros de URL:**
- `userId` (number): ID do usuário

**Query Params:**
- `limit` (number, opcional): Número de estados recentes (padrão: 5)
- `timeWindow` (string, opcional): Janela temporal ('day', 'week', 'month')

**Exemplo de Response:**
```json
{
  "currentState": {
    "valence": 0.7,
    "arousal": 0.5,
    "dominance": 0.8,
    "timestamp": "2025-06-18T23:30:00Z"
  },
  "recentStates": [...],
  "averageValence": 0.65,
  "averageArousal": 0.55,
  "averageDominance": 0.75
}
```

**Respostas:**
- 200: Perfil retornado com sucesso
- 404: Usuário não encontrado
- 500: Erro interno

## Schemas

### EmotionalState
```typescript
interface EmotionalState {
  id: number;
  userId: number;
  timestamp: Date;
  valence: number; // -1 (negativo) a 1 (positivo)
  arousal: number; // 0 (calmo) a 1 (excitado)
  dominance: number; // 0 (sem controle) a 1 (no controle)
  description?: string;
  source: 'self_report' | 'biometric' | 'inferred';
}
```

### EmotionalProfileV2
```typescript
interface EmotionalProfileV2 {
  currentState: EmotionalState;
  recentStates: EmotionalState[];
  averageValence: number;
  averageArousal: number;
  averageDominance: number;
}