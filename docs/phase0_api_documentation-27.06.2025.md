# 📋 API Documentation - Fase 0 MatchIt
## Endpoints de Preferências de Estilo

---

## 🎯 **Visão Geral**

A Fase 0 implementa os endpoints completos para gerenciamento de preferências de estilo dos usuários, conectados ao PostgreSQL e prontos para produção.

### **Base URL**: `http://localhost:3000/api`

### **Autenticação**:
- **Desenvolvimento**: Use o token `test-token`
- **Produção**: JWT válido no header `Authorization: Bearer <token>`

---

## 📋 **Endpoints Implementados**

### **1. Health Check**
```http
GET /api/health
```

**Descrição**: Verificar status do sistema e banco de dados

**Headers**: Nenhum obrigatório

**Resposta**:
```json
{
  "status": "healthy",
  "message": "MatchIt API funcionando",
  "timestamp": "2024-12-27T10:30:00.000Z",
  "database": "connected"
}
```

---

### **2. Perfil do Usuário**
```http
GET /api/profile
```

**Descrição**: Buscar dados básicos do perfil com estatísticas de completude

**Headers**:
```
Authorization: Bearer test-token
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Usuário MatchIt",
    "email": "user@matchit.com",
    "profileCompletion": 60,
    "hasStylePreferences": true,
    "styleStats": {
      "totalCategories": 5,
      "completedCategories": 3,
      "totalAnsweredQuestions": 15,
      "completionPercentage": 60,
      "overallConfidence": 0.75,
      "categoriesProgress": {
        "colors": {
          "answeredQuestions": 5,
          "confidence": 0.8,
          "isCompleted": true
        },
        "styles": {
          "answeredQuestions": 4,
          "confidence": 0.7,
          "isCompleted": true
        }
      }
    }
  },
  "timestamp": "2024-12-27T10:30:00.000Z"
}
```

---

### **3. Buscar Preferências de Estilo**
```http
GET /api/profile/style-preferences
```

**Descrição**: Buscar todas as preferências de estilo do usuário

**Headers**:
```
Authorization: Bearer test-token
```

**Query Parameters**:
- `category` (opcional): Filtrar por categoria específica (`colors`, `styles`, `accessories`, `shoes`, `patterns`)

**Exemplos**:
```http
GET /api/profile/style-preferences
GET /api/profile/style-preferences?category=colors
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "colors": {
        "data": {
          "warm_colors": 0.8,
          "cool_colors": 0.2,
          "bright_colors": 0.7,
          "neutral_colors": 0.5
        },
        "confidence": 0.85,
        "lastUpdated": "2024-12-27T09:15:00.000Z"
      },
      "styles": {
        "data": {
          "casual": 0.9,
          "formal": 0.3,
          "sporty": 0.6,
          "vintage": 0.4
        },
        "confidence": 0.75,
        "lastUpdated": "2024-12-27T09:20:00.000Z"
      }
    },
    "stats": {
      "totalCategories": 5,
      "completedCategories": 2,
      "completionPercentage": 40
    },
    "categories": ["colors", "styles", "accessories", "shoes", "patterns"]
  },
  "timestamp": "2024-12-27T10:30:00.000Z"
}
```

---

### **4. Salvar Preferências de Estilo**
```http
PUT /api/profile/style-preferences
```

**Descrição**: Salvar ou atualizar preferências de uma categoria

**Headers**:
```
Authorization: Bearer test-token
Content-Type: application/json
```

**Body**:
```json
{
  "category": "colors",
  "preferences": {
    "warm_colors": 0.8,
    "cool_colors": 0.2,
    "bright_colors": 0.7,
    "neutral_colors": 0.5
  },
  "confidence": 0.85
}
```

**Campos**:
- `category` (obrigatório): Categoria da preferência
- `preferences` (obrigatório): Objeto com as preferências
- `confidence` (opcional): Nível de confiança (0.0 a 1.0, padrão: 0.8)

**Resposta**:
```json
{
  "success": true,
  "data": {
    "preference": {
      "id": 123,
      "user_id": 1,
      "category": "colors",
      "preference_data": {
        "warm_colors": 0.8,
        "cool_colors": 0.2,
        "bright_colors": 0.7,
        "neutral_colors": 0.5
      },
      "confidence_score": 0.85,
      "last_updated": "2024-12-27T10:30:00.000Z"
    },
    "stats": {
      "completionPercentage": 60,
      "completedCategories": 3
    }
  },
  "message": "Preferências salvas com sucesso",
  "timestamp": "2024-12-27T10:30:00.000Z"
}
```

---

### **5. Salvar Escolha Individual**
```http
POST /api/profile/style-preferences/choice
```

**Descrição**: Salvar uma escolha individual de estilo (para analytics)

**Headers**:
```
Authorization: Bearer test-token
Content-Type: application/json
```

**Body**:
```json
{
  "category": "colors",
  "questionId": "warm_vs_cool_1",
  "selectedOption": "warm_colors",
  "responseTime": 1500,
  "confidence": 4
}
```

**Campos**:
- `category` (obrigatório): Categoria da escolha
- `questionId` (obrigatório): ID único da pergunta
- `selectedOption` (obrigatório): Opção selecionada
- `responseTime` (opcional): Tempo de resposta em ms
- `confidence` (opcional): Nível de confiança (1-5, padrão: 3)

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "user_id": 1,
    "category": "colors",
    "question_id": "warm_vs_cool_1",
    "selected_option": "warm_colors",
    "response_time_ms": 1500,
    "confidence_level": 4,
    "created_at": "2024-12-27T10:30:00.000Z"
  },
  "message": "Escolha salva com sucesso",
  "timestamp": "2024-12-27T10:30:00.000Z"
}
```

---

### **6. Buscar Escolhas por Categoria**
```http
GET /api/profile/style-preferences/choices/:category
```

**Descrição**: Buscar todas as escolhas de uma categoria específica

**Headers**:
```
Authorization: Bearer test-token
```

**Parâmetros**:
- `category`: Categoria desejada (`colors`, `styles`, etc.)

**Exemplo**:
```http
GET /api/profile/style-preferences/choices/colors
```

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "user_id": 1,
      "category": "colors",
      "question_id": "warm_vs_cool_1",
      "selected_option": "warm_colors",
      "response_time_ms": 1500,
      "confidence_level": 4,
      "created_at": "2024-12-27T10:30:00.000Z"
    },
    {
      "id": 457,
      "user_id": 1,
      "category": "colors",
      "question_id": "bright_vs_neutral_1",
      "selected_option": "bright_colors",
      "response_time_ms": 2000,
      "confidence_level": 3,
      "created_at": "2024-12-27T10:25:00.000Z"
    }
  ],
  "category": "colors",
  "count": 2,
  "timestamp": "2024-12-27T10:30:00.000Z"
}
```

---

### **7. Limpar Preferências**
```http
DELETE /api/profile/style-preferences
```

**Descrição**: Remover todas as preferências e escolhas do usuário

**Headers**:
```
Authorization: Bearer test-token
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Preferências removidas com sucesso"
  },
  "message": "Todas as preferências foram removidas",
  "timestamp": "2024-12-27T10:30:00.000Z"
}
```

---

## 🔧 **Códigos de Erro**

### **Códigos HTTP**:
- `200`: Sucesso
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Sem permissão
- `404`: Recurso não encontrado
- `429`: Muitas requisições (rate limit)
- `500`: Erro interno do servidor

### **Códigos de Erro Específicos**:
```json
{
  "success": false,
  "error": "Mensagem de erro amigável",
  "code": "ERROR_CODE",
  "message": "Detalhes técnicos (opcional)"
}
```

**Códigos disponíveis**:
- `MISSING_TOKEN`: Token de acesso não fornecido
- `INVALID_TOKEN_FORMAT`: Formato de token inválido
- `TOKEN_EXPIRED`: Token expirado
- `INVALID_TOKEN`: Token inválido
- `USER_NOT_FOUND`: Usuário não encontrado
- `ACCOUNT_DISABLED`: Conta desativada
- `MISSING_REQUIRED_FIELDS`: Campos obrigatórios em falta
- `FETCH_PREFERENCES_ERROR`: Erro ao buscar preferências
- `SAVE_PREFERENCES_ERROR`: Erro ao salvar preferências
- `SAVE_CHOICE_ERROR`: Erro ao salvar escolha
- `CLEAR_PREFERENCES_ERROR`: Erro ao limpar preferências
- `FETCH_CHOICES_ERROR`: Erro ao buscar escolhas
- `RATE_LIMIT_EXCEEDED`: Limite de requisições excedido

---

## 🧪 **Exemplos de Uso**

### **Exemplo 1: Fluxo Completo de Preferências**
```bash
# 1. Verificar status do sistema
curl http://localhost:3000/api/health

# 2. Buscar perfil do usuário
curl -H "Authorization: Bearer test-token" \
     http://localhost:3000/api/profile

# 3. Salvar preferências de cores
curl -X PUT http://localhost:3000/api/profile/style-preferences \
     -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     -d '{
       "category": "colors",
       "preferences": {
         "warm_colors": 0.8,
         "cool_colors": 0.2
       },
       "confidence": 0.85
     }'

# 4. Buscar preferências atualizadas
curl -H "Authorization: Bearer test-token" \
     http://localhost:3000/api/profile/style-preferences
```

### **Exemplo 2: Salvar Múltiplas Categorias**
```bash
# Salvar preferências de cores
curl -X PUT http://localhost:3000/api/profile/style-preferences \
     -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     -d '{"category": "colors", "preferences": {"warm": 0.8, "cool": 0.2}}'

# Salvar preferências de estilos
curl -X PUT http://localhost:3000/api/profile/style-preferences \
     -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     -d '{"category": "styles", "preferences": {"casual": 0.9, "formal": 0.3}}'

# Salvar preferências de acessórios
curl -X PUT http://localhost:3000/api/profile/style-preferences \
     -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     -d '{"category": "accessories", "preferences": {"minimal": 0.7, "statement": 0.4}}'
```

---

## 🗄️ **Estrutura do Banco de Dados**

### **Tabelas Principais**:

#### **users**
```sql
id          SERIAL PRIMARY KEY
name        VARCHAR(255) NOT NULL
email       VARCHAR(255) UNIQUE NOT NULL
password    VARCHAR(255)
age         INTEGER
gender      VARCHAR(20)
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

#### **user_style_preferences**
```sql
id               SERIAL PRIMARY KEY
user_id          INTEGER REFERENCES users(id)
category         VARCHAR(50) NOT NULL
preference_data  JSONB NOT NULL DEFAULT '{}'
confidence_score DECIMAL(3,2) DEFAULT 0.5
last_updated     TIMESTAMP DEFAULT NOW()
created_at       TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, category)
```

#### **style_choices**
```sql
id               SERIAL PRIMARY KEY
user_id          INTEGER REFERENCES users(id)
session_id       VARCHAR(100)
category         VARCHAR(50) NOT NULL
question_id      VARCHAR(100) NOT NULL
selected_option  VARCHAR(200) NOT NULL
response_time_ms INTEGER
confidence_level INTEGER CHECK (1 <= confidence_level <= 5)
created_at       TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, category, question_id)
```

---

## 🚀 **Como Executar**

### **1. Iniciar o Sistema**
```bash
# No diretório do projeto
npm run server
```

### **2. Executar Testes Automatizados**
```bash
# Em outro terminal
./scripts/test-phase0-complete.sh
```

### **3. Verificar Logs**
```bash
# Monitorar logs do servidor
tail -f logs/app.log

# Verificar logs do PostgreSQL (se necessário)
tail -f /var/log/postgresql/postgresql-*.log
```

---

## ✅ **Checklist de Validação**

### **Funcionalidades**:
- [ ] Health check retorna status OK
- [ ] Perfil do usuário carrega com estatísticas
- [ ] Preferências são salvas no PostgreSQL
- [ ] Preferências são carregadas corretamente
- [ ] Escolhas individuais são registradas
- [ ] Estatísticas de completude são calculadas
- [ ] Limpeza de preferências funciona
- [ ] Rate limiting está ativo
- [ ] Logs estruturados funcionam

### **Performance**:
- [ ] Responses < 500ms em média
- [ ] Banco de dados otimizado com índices
- [ ] Pool de conexões configurado
- [ ] Cache de queries funcionando

### **Segurança**:
- [ ] Autenticação obrigatória nos endpoints sensíveis
- [ ] Validação de input implementada
- [ ] SQL injection prevention
- [ ] Rate limiting por usuário
- [ ] Logs de segurança ativos

---

## 🎯 **Próximos Passos (Fase 1)**

Após validar que a Fase 0 está funcionando perfeitamente:

1. **Implementar sistema de torneios 2x2**
2. **Criar interface gamificada**
3. **Desenvolver admin panel para imagens**
4. **Integrar com sistema de recomendações**

**🚀 Status**: Fase 0 100% implementada e pronta para produção!