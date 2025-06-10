// reorganize-server.js - Script para reorganizar server.js em estrutura modular
// Execute: node reorganize-server.js

import fs from 'fs';
import path from 'path';

const createDirectoryStructure = () => {
  const directories = [
    'server',
    'server/config',
    'server/middleware', 
    'server/routes',
    'server/services',
    'server/utils'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Criado diretório: ${dir}`);
    }
  });
};

const createPackageJsonScript = () => {
  const packageJsonPath = 'package.json';
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Atualizar scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "dev": "nodemon server/app.js",
      "start": "node server/app.js",
      "test": "jest",
      "test:watch": "jest --watch"
    };

    // Adicionar dependências de desenvolvimento se não existirem
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    
    if (!packageJson.devDependencies.nodemon) {
      packageJson.devDependencies.nodemon = "^3.0.0";
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Atualizado package.json com novos scripts');
  }
};

const createEnvExample = () => {
  const envExample = `# Configurações do Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_USER=matchit
DB_PASSWORD=matchit123
DB_NAME=matchit_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development

# CORS Origins (separados por vírgula)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Stripe (se usar)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Logs
LOG_LEVEL=info
`;

  fs.writeFileSync('.env.example', envExample);
  console.log('✅ Criado arquivo .env.example');
};

const createMainApp = () => {
  const appContent = `// server/app.js - Aplicação principal modularizada
import express from 'express';
import { configureMiddleware } from './middleware/index.js';
import { configureRoutes } from './routes/index.js';
import { initializeDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { gracefulShutdown } from './utils/helpers.js';

const app = express();

// Configurar middleware básico
configureMiddleware(app);

// Configurar rotas
configureRoutes(app);

// Middleware de tratamento de erros (deve ser o último)
app.use(notFoundHandler);
app.use(errorHandler);

// Inicialização do servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await initializeDatabase();
    
    const PORT = process.env.PORT || 3000;
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(\`🚀 Servidor MatchIt rodando na porta \${PORT}\`);
      console.log(\`📊 Environment: \${process.env.NODE_ENV || 'development'}\`);
      console.log(\`💾 Database: \${process.env.DB_HOST || 'localhost'}:\${process.env.DB_PORT || 5432}\`);
      console.log(\`🌐 Health check: http://localhost:\${PORT}/api/health\`);
      console.log(\`📖 API info: http://localhost:\${PORT}/api/info\`);
    });

    server.timeout = 60000;
    
    // Configurar graceful shutdown
    gracefulShutdown(server);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
`;

  fs.writeFileSync('server/app.js', appContent);
  console.log('✅ Criado server/app.js');
};

const createReadme = () => {
  const readmeContent = `# MatchIt API - Estrutura Modular

## 📁 Estrutura de Pastas

\`\`\`
server/
├── app.js                    # Entry point principal
├── config/
│   ├── database.js          # Configuração PostgreSQL
│   ├── cors.js              # Configuração CORS
│   └── environment.js       # Variáveis de ambiente
├── middleware/
│   ├── auth.js              # Autenticação JWT
│   ├── validation.js        # Validação de dados
│   ├── errorHandler.js      # Tratamento de erros
│   ├── logger.js            # Logs e monitoring
│   └── index.js             # Configurador de middleware
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── profile.js           # Rotas de perfil
│   ├── matches.js           # Rotas de matching
│   ├── chat.js              # Rotas de chat
│   ├── products.js          # Rotas de produtos
│   ├── recommendations.js   # Rotas de recomendação
│   ├── subscription.js      # Rotas VIP
│   ├── health.js            # Health checks
│   └── index.js             # Router principal
├── services/
│   ├── authService.js       # Lógica de autenticação
│   ├── recommendationService.js # Algoritmos de recomendação
│   ├── matchService.js      # Lógica de matches
│   └── subscriptionService.js # Lógica VIP
└── utils/
    ├── constants.js         # Constantes globais
    └── helpers.js           # Funções auxiliares
\`\`\`

## 🚀 Como executar

1. **Instalar dependências:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configurar ambiente:**
   \`\`\`bash
   cp .env.example .env
   # Editar .env com suas configurações
   \`\`\`

3. **Executar em desenvolvimento:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Executar em produção:**
   \`\`\`bash
   npm start
   \`\`\`

## 🧪 Testes

\`\`\`bash
npm test              # Executar todos os testes
npm run test:watch   # Executar testes em modo watch
\`\`\`

## 📋 Migração do server.js original

O server.js original foi reorganizado da seguinte forma:

- **Configurações** → \`config/\`
- **Middleware** → \`middleware/\`
- **Rotas** → \`routes/\`
- **Lógica de negócio** → \`services/\`
- **Utilitários** → \`utils/\`

## 🔧 Vantagens da nova estrutura

- ✅ **Manutenção simplificada**
- ✅ **Testes unitários** por módulo
- ✅ **Reutilização** de código
- ✅ **Desenvolvimento paralelo**
- ✅ **Debugging** mais fácil
- ✅ **Escalabilidade** infinita

## 📚 Endpoints disponíveis

- \`GET /api/health\` - Health check
- \`GET /api/info\` - Informações da API
- \`POST /api/auth/register\` - Registro de usuário
- \`POST /api/auth/login\` - Login de usuário
- \`GET /api/profile\` - Perfil do usuário
- \`GET /api/recommendations\` - Recomendações
- \`POST /api/recommendations/feedback\` - Feedback de recomendação
- E muitos outros...
`;

  fs.writeFileSync('README-MODULAR.md', readmeContent);
  console.log('✅ Criado README-MODULAR.md');
};

// Função principal
const reorganizeServer = () => {
  console.log('🚀 Iniciando reorganização do server.js...\n');
  
  try {
    createDirectoryStructure();
    createPackageJsonScript();
    createEnvExample();
    createMainApp();
    createReadme();
    
    console.log('\n✅ Reorganização concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute os próximos scripts para criar os arquivos modulares');
    console.log('2. Mova seu server.js atual para server.js.backup');
    console.log('3. Execute: npm run dev');
    console.log('4. Teste todas as rotas');
    
  } catch (error) {
    console.error('❌ Erro durante a reorganização:', error);
  }
};

// Executar se chamado diretamente
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  reorganizeServer();
}

export { reorganizeServer };
