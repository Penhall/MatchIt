# Guia de Implementação - Fase 0
## Integração Crítica Backend-Frontend

### 🎯 **Objetivo da Fase 0**
Implementar integração completa entre backend e frontend para preferências de estilo, eliminando dados mockados e estabelecendo base funcional para as próximas fases.

### ⏱️ **Tempo Estimado: 3-5 dias**

---

## 📋 **Checklist de Implementação**

### **Dia 1: Backend Endpoints** ✅

#### **1.1 - Atualizar Arquivo de Rotas**
```bash
# Substituir o arquivo server/routes/profile.js
cp server/routes/profile.js server/routes/profile.js.backup
# Implementar o novo arquivo com os endpoints de estilo
```

**Arquivo:** `server/routes/profile.js`
- [ ] Endpoint `GET /api/profile/style-preferences`
- [ ] Endpoint `PUT /api/profile/style-preferences`
- [ ] Endpoint `POST /api/profile/style-preferences/batch`
- [ ] Endpoint `DELETE /api/profile/style-preferences`
- [ ] Middleware de autenticação aplicado
- [ ] Tratamento de erros implementado
- [ ] Validação de dados entrada

#### **1.2 - Atualizar ProfileService**
```bash
# Backup do service atual
cp server/services/profileService.js server/services/profileService.js.backup
# Implementar métodos de estilo
```

**Arquivo:** `server/services/profileService.js`
- [ ] Método `getStyleChoicesByUserId()`
- [ ] Método `updateStyleChoice()`
- [ ] Método `clearStyleChoices()`
- [ ] Método `getStyleCompletionStats()`
- [ ] Integração com banco de dados
- [ ] Tratamento de erros
- [ ] Logs estruturados

#### **1.3 - Verificar Banco de Dados**
```sql
-- Verificar se tabela style_choices existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'style_choices';

-- Se não existir, criar:
CREATE TABLE style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);
```

**Verificações:**
- [ ] Tabela `style_choices` existe
- [ ] Relacionamento com `users` configurado
- [ ] Índices criados para performance
- [ ] Permissões de acesso corretas

#### **1.4 - Testar Endpoints Backend**
```bash
# Iniciar servidor
npm run server

# Testar health check
curl http://localhost:3000/api/health

# Testar autenticação (registrar usuário)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'

# Obter token do response e testar style preferences
curl -X GET http://localhost:3000/api/profile/style-preferences \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Verificações:**
- [ ] Servidor inicia sem erros
- [ ] Endpoint GET retorna estrutura correta
- [ ] Endpoint PUT cria/atualiza preferências
- [ ] Endpoint POST batch funciona
- [ ] Endpoint DELETE remove dados
- [ ] Error handling funciona (401, 400, 500)

---

### **Dia 2: Frontend Integration** ✅

#### **2.1 - Atualizar Tipos TypeScript**
```bash
# Criar/atualizar arquivo de tipos
```

**Arquivo:** `types/recommendation.ts`
- [ ] Interface `StylePreference`
- [ ] Interface `StylePreferencesResponse`
- [ ] Interface `StyleQuestion` e `StyleOption`
- [ ] Tipos de estado e erro
- [ ] Tipos de API response
- [ ] Tipos de componentes React Native
- [ ] Configuração de navegação

#### **2.2 - Implementar StyleAdjustmentScreen**
```bash
# Backup da tela atual
cp screens/StyleAdjustmentScreen.tsx screens/StyleAdjustmentScreen.tsx.backup
# Implementar nova versão
```

**Arquivo:** `screens/StyleAdjustmentScreen.tsx`
- [ ] Hook `useAuth` integrado
- [ ] Hook `useApi` integrado
- [ ] Estado para loading e errors
- [ ] Função `fetchStylePreferences()`
- [ ] Função `updateStylePreference()`
- [ ] Função `saveAllPreferences()`
- [ ] Handler de seleção de opções
- [ ] Componentes de progresso
- [ ] Tratamento de erros com Alert
- [ ] Auto-save funcional
- [ ] Indicadores visuais de loading

#### **2.3 - Verificar Hooks Necessários**
```bash
# Verificar se hooks existem e funcionam
```

**Hooks necessários:**
- [ ] `useAuth()` - retorna user, isAuthenticated
- [ ] `useApi()` - retorna api methods com auth
- [ ] Configuração de axios/fetch
- [ ] Interceptors para auth token
- [ ] Error handling global

#### **2.4 - Testar Integração Frontend**
```bash
# Executar aplicação React Native
npm start
# ou
npx react-native run-android
# ou  
npx react-native run-ios
```

**Verificações:**
- [ ] Tela carrega sem erros de tipo
- [ ] Preferências são carregadas do backend
- [ ] Seleção de opções salva automaticamente
- [ ] Indicadores de loading aparecem
- [ ] Mensagens de erro são exibidas
- [ ] Progresso é calculado corretamente
- [ ] Navegação funciona

---

### **Dia 3: Testing e Error Handling** ✅

#### **3.1 - Executar Testes Automatizados**
```bash
# Instalar dependências de teste se necessário
npm install node-fetch --save-dev

# Executar script de teste da Fase 0
node tests/phase0-integration-test.js
```

**Arquivo:** `tests/phase0-integration-test.js`
- [ ] Testes de endpoints backend
- [ ] Testes de autenticação
- [ ] Testes de error handling
- [ ] Testes de performance
- [ ] Testes de tipagem
- [ ] Cleanup automático

#### **3.2 - Testes Manuais**
```bash
# Sequência de testes manuais para validar integração
```

**Cenários de teste:**
- [ ] **Usuário novo**: Sem preferências, tela vazia
- [ ] **Primeira seleção**: Cria preferência no banco
- [ ] **Atualizar preferência**: Modifica existente
- [ ] **Múltiplas categorias**: Salva em categorias diferentes
- [ ] **Reload da página**: Carrega dados salvos
- [ ] **Perda de conexão**: Exibe erro apropriado
- [ ] **Token expirado**: Redireciona para login
- [ ] **Batch save**: Salva múltiplas de uma vez

#### **3.3 - Performance Testing**
```bash
# Testar performance dos endpoints
```

**Métricas alvo:**
- [ ] GET preferences: < 200ms
- [ ] PUT single preference: < 500ms
- [ ] POST batch preferences: < 1000ms
- [ ] 5 requests concorrentes: < 2000ms
- [ ] Uso de memória estável
- [ ] Sem memory leaks

---

### **Dia 4: Correções e Polimento** ✅

#### **4.1 - Correção de Bugs Encontrados**
```bash
# Implementar correções baseadas nos testes
```

**Problemas comuns a verificar:**
- [ ] Campos obrigatórios validados
- [ ] Tipos de dados consistentes
- [ ] Encoding de caracteres especiais
- [ ] Timezone handling
- [ ] Race conditions em updates
- [ ] Error messages user-friendly

#### **4.2 - Otimizações**
```bash
# Implementar melhorias de performance
```

**Otimizações:**
- [ ] Debounce em auto-save (300ms)
- [ ] Cache de preferências localmente
- [ ] Lazy loading de componentes
- [ ] Otimização de re-renders
- [ ] Compression de requests
- [ ] Indexes de banco otimizados

#### **4.3 - Documentação**
```bash
# Documentar APIs e implementação
```

**Documentação:**
- [ ] README atualizado
- [ ] API endpoints documentados
- [ ] Swagger/OpenAPI spec
- [ ] Comentários no código
- [ ] Guia de troubleshooting

---

### **Dia 5: Validação Final** ✅

#### **5.1 - Teste de Aceitação**
```bash
# Executar sequência completa de validação
```

**Critérios de aceitação:**
- [ ] ✅ Todos os testes automatizados passam
- [ ] ✅ Performance dentro dos targets
- [ ] ✅ Error handling robusto
- [ ] ✅ UI responsiva e intuitiva  
- [ ] ✅ Dados persistem corretamente
- [ ] ✅ Integração backend-frontend 100%
- [ ] ✅ Sem dados mockados remanescentes
- [ ] ✅ Tipagem TypeScript sem erros

#### **5.2 - Deploy e Monitoramento**
```bash
# Preparar para produção
```

**Deploy checklist:**
- [ ] Environment variables configuradas
- [ ] Database migrations aplicadas
- [ ] Logs estruturados funcionando
- [ ] Monitoring configurado
- [ ] Rollback plan preparado
- [ ] Health checks funcionando

---

## 🚀 **Comandos Rápidos**

### **Setup Inicial**
```bash
# Backup de segurança
cp server/routes/profile.js server/routes/profile.js.backup.$(date +%Y%m%d)
cp server/services/profileService.js server/services/profileService.js.backup.$(date +%Y%m%d)
cp screens/StyleAdjustmentScreen.tsx screens/StyleAdjustmentScreen.tsx.backup.$(date +%Y%m%d)

# Criar estrutura de testes
mkdir -p tests
```

### **Desenvolvimento**
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend  
npm start

# Terminal 3: Testes
npm test
```

### **Verificação Rápida**
```bash
# Testar health do sistema
curl http://localhost:3000/api/health

# Verificar logs
tail -f server/logs/application.log

# Monitorar banco de dados
psql -d matchit -c "SELECT COUNT(*) FROM style_choices;"
```

---

## 📊 **Critérios de Sucesso**

### **Funcionais**
- [x] Usuário pode ver suas preferências salvas
- [x] Usuário pode criar nova preferência
- [x] Usuário pode atualizar preferência existente
- [x] Usuário pode limpar todas as preferências
- [x] Sistema calcula progresso corretamente
- [x] Auto-save funciona sem interferir na UX

### **Técnicos**
- [x] 100% dos endpoints funcionando
- [x] 0 dados mockados remanescentes
- [x] < 500ms response time médio
- [x] Error rate < 1%
- [x] 100% cobertura de error handling
- [x] TypeScript 0 erros

### **Qualidade**
- [x] Code review approved
- [x] Testes automatizados passando
- [x] Performance benchmarks atingidos
- [x] Documentação atualizada
- [x] Logs estruturados implementados

---

## 🔧 **Troubleshooting**

### **Problemas Comuns**

#### **1. Erro 401 Unauthorized**
```bash
# Verificar se token está sendo enviado
curl -v -H "Authorization: Bearer TOKEN" http://localhost:3000/api/profile/style-preferences

# Verificar middleware de auth
grep -r "authenticateToken" server/routes/
```

#### **2. Preferências não salvam**
```sql
-- Verificar tabela
\d style_choices

-- Verificar dados
SELECT * FROM style_choices WHERE user_id = USER_ID;

-- Verificar constraints
\d+ style_choices
```

#### **3. Frontend não carrega dados**
```javascript
// Verificar console do browser
console.log('API Base URL:', process.env.REACT_APP_API_URL);

// Verificar network tab no DevTools
// Verificar se requests estão sendo feitos
```

#### **4. Performance lenta**
```sql
-- Verificar queries lentas
EXPLAIN ANALYZE SELECT * FROM style_choices WHERE user_id = 1;

-- Criar índices se necessário
CREATE INDEX idx_style_choices_user_id ON style_choices(user_id);
```

### **Contatos de Suporte**
- **Database**: Verificar logs PostgreSQL
- **Backend**: Verificar logs application
- **Frontend**: Verificar DevTools console
- **Network**: Verificar CORS e proxy

---

## 🎉 **Conclusão da Fase 0**

Após completar esta fase, você terá:

✅ **Backend totalmente funcional** com endpoints robustos  
✅ **Frontend integrado** sem dados mockados  
✅ **Error handling** completo e user-friendly  
✅ **Performance otimizada** dentro dos targets  
✅ **Tipagem TypeScript** correta e completa  
✅ **Testes automatizados** validando tudo  

**🚀 Próximo passo:** Fase 1 - Implementação do Perfil Emocional

**📈 Progresso do projeto:** 70% → 85% implementado

---

## 🚀 **Execução Prática - Comandos Diretos**

### **PASSO 1: Implementar os Arquivos (15 min)**

```bash
# 1. Backup dos arquivos existentes
cp server/routes/profile.js server/routes/profile.js.backup.$(date +%Y%m%d)
cp server/services/profileService.js server/services/profileService.js.backup.$(date +%Y%m%d)
cp screens/StyleAdjustmentScreen.tsx screens/StyleAdjustmentScreen.tsx.backup.$(date +%Y%m%d)

# 2. Criar arquivo de tipos se não existir
mkdir -p types
```

**✅ Arquivos para implementar (use os artifacts criados):**
1. `server/routes/profile.js` → Artifact: `style_endpoints_backend`
2. `server/services/profileService.js` → Artifact: `profile_service_updated`  
3. `screens/StyleAdjustmentScreen.tsx` → Artifact: `style_adjustment_screen_fixed`
4. `types/recommendation.ts` → Artifact: `types_recommendation_updated`

### **PASSO 2: Verificar Banco de Dados (5 min)**

```sql
-- Conectar ao PostgreSQL
psql -d matchit_development

-- Verificar se tabela existe
\dt style_choices

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);

-- Verificar estrutura
\d style_choices
```

### **PASSO 3: Testar Backend (10 min)**

```bash
# 1. Iniciar servidor
npm run server
# ou
node server/app.js

# 2. Em outro terminal, testar endpoints
# Registrar usuário de teste
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_fase0@example.com","password":"123456","name":"Teste Fase 0"}'

# Copiar o token do response e testar style preferences
export TOKEN="seu_token_aqui"

# Testar GET (deve retornar vazio inicialmente)
curl -X GET http://localhost:3000/api/profile/style-preferences \
  -H "Authorization: Bearer $TOKEN"

# Testar PUT (criar primeira preferência)
curl -X PUT http://localhost:3000/api/profile/style-preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"cores","questionId":"color_1","selectedOption":"warm"}'

# Testar GET novamente (deve retornar a preferência criada)
curl -X GET http://localhost:3000/api/profile/style-preferences \
  -H "Authorization: Bearer $TOKEN"
```

### **PASSO 4: Testar Frontend (15 min)**

```bash
# 1. Verificar se hooks useAuth e useApi existem
# Se não existirem, criar versões básicas

# 2. Iniciar aplicação React Native
npm start
# ou
npx react-native run-android

# 3. Navegar para StyleAdjustmentScreen
# 4. Verificar se carrega sem erros
# 5. Testar seleção de uma opção
# 6. Verificar se salva no backend
```

### **PASSO 5: Executar Testes Automatizados (10 min)**

```bash
# 1. Instalar dependência para testes
npm install node-fetch --save-dev

# 2. Criar arquivo de teste
# Usar o artifact: phase_0_test_script

# 3. Executar teste
node tests/phase0-integration-test.js

# 4. Verificar se todos os testes passam
# Target: > 90% de sucesso
```

### **PASSO 6: Validação Final (5 min)**

```bash
# Checklist de validação rápida:

# ✅ Backend
curl http://localhost:3000/api/health
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/profile/style-preferences

# ✅ Database
psql -d matchit_development -c "SELECT COUNT(*) FROM style_choices;"

# ✅ Frontend
# - Tela carrega sem erros
# - Preferências são salvas
# - Auto-save funciona
# - Estados de loading aparecem

# ✅ Logs
tail -f server/logs/application.log
```

---

## 🎯 **Checklist de Validação Rápida**

### **Backend ✅**
- [ ] Servidor inicia sem erros
- [ ] GET `/api/profile/style-preferences` retorna estrutura correta
- [ ] PUT `/api/profile/style-preferences` cria/atualiza preferência
- [ ] POST `/api/profile/style-preferences/batch` processa múltiplas
- [ ] DELETE `/api/profile/style-preferences` remove dados
- [ ] Error handling (401, 400, 500) funciona

### **Database ✅**
- [ ] Tabela `style_choices` existe
- [ ] Relacionamento com `users` funciona
- [ ] Constraints UNIQUE funcionam
- [ ] Índices criados para performance

### **Frontend ✅**
- [ ] `StyleAdjustmentScreen` carrega sem erros TypeScript
- [ ] Preferências são carregadas do backend
- [ ] Seleção de opções funciona
- [ ] Auto-save salva no backend
- [ ] Indicadores de loading aparecem
- [ ] Mensagens de erro são exibidas

### **Integração ✅**
- [ ] Frontend busca dados reais do backend
- [ ] Mudanças no frontend persistem no banco
- [ ] Error handling end-to-end funciona
- [ ] Performance < 500ms response time
- [ ] Não há dados mockados remanescentes

---

## 🚨 **Soluções para Problemas Comuns**

### **1. Erro "style_choices table does not exist"**
```sql
-- Executar no PostgreSQL
CREATE TABLE style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);
```

### **2. Hooks useAuth/useApi não existem**
```typescript
// hooks/useAuth.ts - Versão básica
export const useAuth = () => ({
  user: { id: 1 }, // Mock temporário
  isAuthenticated: true
});

// hooks/useApi.ts - Versão básica  
export const useApi = () => ({
  api: {
    get: (url) => fetch(`${API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` }}),
    put: (url, data) => fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
    post: (url, data) => fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
    delete: (url) => fetch(`${API_BASE_URL}${url}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }})
  }
});
```

### **3. Erro 401 Unauthorized**
```bash
# Verificar se token está sendo enviado
curl -v -H "Authorization: Bearer TOKEN" http://localhost:3000/api/profile/style-preferences

# Verificar middleware de autenticação
grep -r "authenticateToken" server/routes/
```

### **4. ProfileService não encontrado**
```bash
# Verificar se arquivo existe
ls -la server/services/profileService.js

# Verificar exports
grep "export" server/services/profileService.js
```

---

## 🎉 **Critérios de Sucesso da Fase 0**

### **Técnicos ✅**
- ✅ 100% dos endpoints implementados e funcionando
- ✅ 0 dados mockados remanescentes  
- ✅ < 500ms response time médio
- ✅ Error rate < 1%
- ✅ TypeScript 0 erros de compilação
- ✅ Auto-save funcional

### **Funcionais ✅**
- ✅ Usuário pode ver preferências salvas
- ✅ Usuário pode criar/atualizar preferências
- ✅ Sistema calcula progresso corretamente
- ✅ Loading states funcionam
- ✅ Error handling user-friendly
- ✅ Navegação entre telas funciona

### **Qualidade ✅**
- ✅ Testes automatizados > 90% sucesso
- ✅ Performance benchmarks atingidos
- ✅ Logs estruturados funcionando
- ✅ Code review ready
- ✅ Documentação atualizada

**🚀 Resultado:** Base sólida estabelecida para Fase 1 (Perfil Emocional)

**📈 Progresso:** 70% → 85% implementado

---

**💡 Dica de Execução:** 
1. Execute PASSO 1-2 primeiro (implementação + DB)
2. Teste PASSO 3 (backend) até funcionar 100%
3. Implemente PASSO 4 (frontend) 
4. Execute PASSO 5 (testes) para validar tudo
5. PASSO 6 é validação final

**⏱️ Tempo total estimado: 1-2 horas de trabalho focado**