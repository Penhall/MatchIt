# 🔧 Guia de Setup - Configuração para Seu Ambiente

## 📋 Configurações Obrigatórias

### ✅ **1. Email (OBRIGATÓRIO para relatórios e alertas)**

Substitua estas linhas no `.env`:
```bash
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
EMAIL_FROM=MatchIt Analytics <seu_email@gmail.com>
ALERT_EMAIL_RECIPIENTS=seu_email@gmail.com
DAILY_REPORT_RECIPIENTS=seu_email@gmail.com
WEEKLY_REPORT_RECIPIENTS=seu_email@gmail.com
MONTHLY_REPORT_RECIPIENTS=seu_email@gmail.com
```

**⚠️ Para Gmail:**
1. Ativar autenticação de 2 fatores
2. Gerar senha de app: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Usar a senha de app gerada (não sua senha normal)

### ✅ **2. Redis (OBRIGATÓRIO para cache)**

**MacOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
```bash
# Usar WSL ou Docker
docker run -d -p 6379:6379 redis:alpine
```

**Verificar se Redis está funcionando:**
```bash
redis-cli ping
# Deve retornar: PONG
```

### ✅ **3. Estrutura de Pastas**

Execute para criar as pastas necessárias:
```bash
mkdir -p logs reports backups storage templates/emails templates/reports
chmod 755 logs reports backups storage
```

## 🗄️ Configuração do Banco de Dados

### ✅ **1. Verificar Conexão Atual**
```bash
psql -h localhost -p 5432 -U matchit -d matchit_db
# Digite a senha: matchit123
# Se conectar com sucesso, digite \q para sair
```

### ✅ **2. Criar Schema de Analytics**

**Opção 1: Automática (Recomendada)**
```bash
# Após implementar os arquivos, execute:
node scripts/migrate-analytics.js setup
```

**Opção 2: Manual**
```sql
-- Conectar ao PostgreSQL
psql -h localhost -p 5432 -U matchit -d matchit_db

-- Executar script (após implementar o arquivo)
\i server/migrations/003_analytics_schema.sql

-- Verificar tabelas criadas
\dt analytics_*

-- Sair
\q
```

## 📦 Dependências Necessárias

### ✅ **1. Instalar Dependências Backend**
```bash
npm install express pg cors helmet compression body-parser
npm install express-rate-limit express-validator jsonwebtoken
npm install dotenv uuid lodash date-fns moment-timezone
npm install node-cron nodemailer csvtojson json2csv pdfkit xlsx
npm install ws socket.io redis bull agenda winston morgan
npm install recharts chart.js d3
```

### ✅ **2. Instalar Dependências Frontend React Native**
```bash
npm install react-native-chart-kit react-native-linear-gradient
npm install @expo/vector-icons lucide-react lucide-react-native
npm install @react-native-async-storage/async-storage
```

### ✅ **3. Instalar Dependências de Desenvolvimento**
```bash
npm install --save-dev @types/node @types/express @types/pg @types/uuid @types/lodash
npm install --save-dev jest supertest nodemon eslint prettier husky lint-staged
```

## 🚀 Teste Rápido da Configuração

### ✅ **1. Testar Conexões**

Crie o arquivo `scripts/test-config.js`:
```javascript
require('dotenv').config();
const { Pool } = require('pg');
const redis = require('redis');

async function testConfig() {
  console.log('🔍 Testando configurações...\n');
  
  // Testar PostgreSQL
  try {
    const db = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL: Conectado');
    await db.end();
  } catch (error) {
    console.log('❌ PostgreSQL:', error.message);
  }
  
  // Testar Redis
  try {
    const client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });
    
    await client.connect();
    await client.ping();
    console.log('✅ Redis: Conectado');
    await client.quit();
  } catch (error) {
    console.log('❌ Redis:', error.message);
  }
  
  // Verificar variáveis essenciais
  const required = ['DB_HOST', 'DB_NAME', 'JWT_SECRET', 'EMAIL_USER'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    console.log('✅ Variáveis de ambiente: OK');
  } else {
    console.log('❌ Variáveis faltando:', missing.join(', '));
  }
  
  console.log('\n🎉 Teste concluído!');
}

testConfig();
```

Execute:
```bash
node scripts/test-config.js
```

## 🔧 Integração com Seu Sistema Atual

### ✅ **1. Modificar seu server/app.js**

Adicione essas linhas após a criação do app Express:
```javascript
// Importar analytics integration
const { AnalyticsIntegration } = require('./integrations/analytics-integration');

// Após criar o app express
const app = express();

// Configurações existentes do seu app...

// Adicionar analytics (APÓS todas as configurações existentes)
let analyticsIntegration;

// Função de inicialização
async function initializeAnalytics() {
  try {
    analyticsIntegration = new AnalyticsIntegration(app);
    await analyticsIntegration.initialize();
    console.log('✅ Analytics system initialized');
  } catch (error) {
    console.error('⚠️ Analytics initialization failed:', error);
    // Não quebrar a aplicação se analytics falhar
  }
}

// Na função de start do servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // Inicializar analytics após servidor estar rodando
  await initializeAnalytics();
});
```

### ✅ **2. Adicionar Tracking Básico**

Em suas rotas existentes, adicione tracking:
```javascript
// Exemplo em uma rota de recomendações
app.get('/api/recommendations', async (req, res) => {
  try {
    // Sua lógica existente...
    const recommendations = await getRecommendations();
    
    // Adicionar tracking
    if (analyticsIntegration) {
      await analyticsIntegration.trackEvent({
        eventType: 'user_action',
        eventName: 'recommendations_requested',
        userId: req.user?.id,
        properties: {
          count: recommendations.length,
          filters: req.query
        }
      });
    }
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📱 Frontend - Integração React Native

### ✅ **1. Adicionar ao seu App Principal**

```javascript
// App.js ou App.tsx
import React from 'react';
import { AnalyticsProvider } from './hooks/analytics/useAnalytics';

export default function App() {
  return (
    <AnalyticsProvider>
      {/* Seus componentes existentes */}
      
      {/* Adicionar link para dashboard */}
      <Button 
        title="Analytics Dashboard" 
        onPress={() => navigation.navigate('AnalyticsDashboard')} 
      />
    </AnalyticsProvider>
  );
}
```

### ✅ **2. Adicionar à Navegação**

```javascript
// Suas rotas de navegação
import AnalyticsDashboard from './screens/AnalyticsDashboard';

// Na configuração de rotas
const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Suas telas existentes */}
      
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsDashboard}
        options={{ title: 'Analytics Dashboard' }}
      />
    </Stack.Navigator>
  );
}
```

## 🧪 Verificação Final

### ✅ **Lista de Verificação**

```bash
# 1. Testar conexões
node scripts/test-config.js

# 2. Executar migração
node scripts/migrate-analytics.js migrate

# 3. Verificar tabelas
psql -h localhost -U matchit -d matchit_db -c "\dt analytics_*"

# 4. Iniciar aplicação
npm start

# 5. Testar API de analytics
curl http://localhost:3001/api/analytics/integration/status
```

### ✅ **Sinais de Sucesso**

Você saberá que está funcionando quando:
- ✅ `node scripts/test-config.js` retorna todas as conexões OK
- ✅ Aplicação inicia sem erros
- ✅ URL `http://localhost:3001/api/analytics/integration/status` retorna JSON com `"initialized": true`
- ✅ Dashboard React Native carrega sem erros
- ✅ Logs mostram eventos sendo registrados

### ✅ **Se Algo Der Errado**

**Redis não conecta:**
```bash
brew services restart redis  # MacOS
sudo systemctl restart redis # Linux
```

**PostgreSQL não conecta:**
```bash
# Verificar se está rodando
brew services restart postgresql # MacOS
sudo systemctl restart postgresql # Linux
```

**Erro de permissões:**
```bash
chmod 755 logs reports backups
```

**Dependências faltando:**
```bash
npm install
```

## 🎯 Próximo Passo

Após configurar tudo:

1. **Copie o novo arquivo `.env`** (substituindo o atual)
2. **Execute os testes de configuração**
3. **Implemente os arquivos do sistema** (usando os artifacts criados)
4. **Execute a migração do banco**
5. **Inicie a aplicação e teste**

**Tempo estimado de setup: 30-45 minutos** ⏱️