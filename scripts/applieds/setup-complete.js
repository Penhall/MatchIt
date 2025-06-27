// scripts/setup-complete.js - Setup Automático Completo do MatchIt
import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

// Cores para output no console
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, message) => {
  log(`\n🔄 ${step}: ${message}`, 'blue');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
};

const logWarning = (message) => {
  log(`⚠️ ${message}`, 'yellow');
};

const logError = (message) => {
  log(`❌ ${message}`, 'red');
};

// Verificar se estamos no diretório correto
const checkProjectRoot = () => {
  if (!fs.existsSync('package.json')) {
    logError('package.json não encontrado. Execute este script na raiz do projeto MatchIt.');
    process.exit(1);
  }
  logSuccess('Diretório do projeto identificado');
};

// Criar estrutura de diretórios
const createDirectories = () => {
  logStep('PASSO 1', 'Criando estrutura de diretórios');
  
  const directories = [
    'server',
    'server/config',
    'server/middleware',
    'server/routes',
    'server/services',
    'server/utils',
    'scripts',
    'logs',
    'uploads',
    'tests'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Diretório criado: ${dir}`);
    } else {
      log(`Diretório já existe: ${dir}`, 'cyan');
    }
  });
};

// Instalar dependências Node.js
const installDependencies = () => {
  logStep('PASSO 2', 'Instalando dependências Node.js');
  
  try {
    // Verificar se node_modules existe
    if (!fs.existsSync('node_modules')) {
      log('Executando npm install...', 'yellow');
      execSync('npm install', { stdio: 'inherit' });
      logSuccess('Dependências instaladas');
    } else {
      logWarning('node_modules já existe, verificando atualizações...');
      try {
        execSync('npm outdated', { stdio: 'inherit' });
      } catch (error) {
        // npm outdated retorna exit code 1 se há updates, isso é normal
      }
    }
    
    // Instalar dependências específicas se não existirem
    const requiredDeps = [
      'express',
      'pg',
      'cors',
      'helmet',
      'compression',
      'dotenv',
      'jsonwebtoken',
      'bcrypt',
      'express-validator',
      'express-rate-limit'
    ];
    
    // Verificar se deps estão instaladas
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      log(`Instalando dependências faltantes: ${missingDeps.join(', ')}`, 'yellow');
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      logSuccess('Dependências adicionais instaladas');
    }
    
  } catch (error) {
    logError(`Erro ao instalar dependências: ${error.message}`);
    process.exit(1);
  }
};

// Verificar arquivo .env
const checkEnvFile = () => {
  logStep('PASSO 3', 'Verificando arquivo .env');
  
  if (!fs.existsSync('.env')) {
    logWarning('Arquivo .env não encontrado');
    log('Por favor, crie o arquivo .env usando o artifact fornecido', 'yellow');
  } else {
    logSuccess('Arquivo .env encontrado');
    
    // Verificar configurações essenciais
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    
    const missingVars = requiredVars.filter(varName => 
      !envContent.includes(`${varName}=`)
    );
    
    if (missingVars.length > 0) {
      logWarning(`Variáveis faltantes no .env: ${missingVars.join(', ')}`);
    } else {
      logSuccess('Todas as variáveis essenciais encontradas no .env');
    }
  }
};

// Testar conexão com banco de dados
const testDatabase = async () => {
  logStep('PASSO 4', 'Testando conexão com banco de dados');
  
  try {
    // Carregar variáveis de ambiente
    require('dotenv').config();
    
    import { Client  } from 'pg';
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'matchit_db',
      user: process.env.DB_USER || 'matchit',
      password: process.env.DB_PASSWORD || 'matchit123',
    });
    
    await client.connect();
    const result = await client.query('SELECT NOW()');
    await client.end();
    
    logSuccess(`Conexão com banco bem-sucedida! Hora do servidor: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logError(`Erro na conexão com banco: ${error.message}`);
    logWarning('Certifique-se de que PostgreSQL está rodando e as credenciais estão corretas');
    return false;
  }
};

// Criar tabela de usuários básica
const createBasicTables = async () => {
  logStep('PASSO 5', 'Criando tabelas básicas');
  
  try {
    require('dotenv').config();
    import { Client  } from 'pg';
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'matchit_db',
      user: process.env.DB_USER || 'matchit',
      password: process.env.DB_PASSWORD || 'matchit123',
    });
    
    await client.connect();
    
    // Criar tabela users se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar índice no email
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
    // Verificar tabelas criadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    await client.end();
    
    logSuccess(`Tabelas verificadas/criadas: ${tables.rows.map(r => r.table_name).join(', ')}`);
    return true;
  } catch (error) {
    logError(`Erro ao criar tabelas: ${error.message}`);
    return false;
  }
};

// Testar servidor
const testServer = () => {
  logStep('PASSO 6', 'Testando servidor');
  
  return new Promise((resolve) => {
    // Verificar se server/app.js existe
    if (!fs.existsSync('server/app.js')) {
      logWarning('server/app.js não encontrado');
      logWarning('Por favor, implemente os arquivos do servidor usando os artifacts fornecidos');
      resolve(false);
      return;
    }
    
    try {
      // Tentar iniciar servidor brevemente
      import { spawn  } from 'child_process';
      const serverProcess = spawn('node', ['server/app.js'], {
        env: { ...process.env, PORT: '3000' }
      });
      
      let serverStarted = false;
      
      setTimeout(() => {
        if (!serverStarted) {
          serverProcess.kill();
          logWarning('Servidor demorou para iniciar - pode haver problemas');
          resolve(false);
        }
      }, 10000);
      
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Servidor MatchIt iniciado') || output.includes('3000')) {
          logSuccess('Servidor iniciou com sucesso!');
          serverStarted = true;
          setTimeout(() => {
            serverProcess.kill();
            resolve(true);
          }, 2000);
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('ExperimentalWarning')) {
          logError(`Erro no servidor: ${error}`);
        }
      });
      
      serverProcess.on('error', (error) => {
        logError(`Erro ao iniciar servidor: ${error.message}`);
        resolve(false);
      });
      
    } catch (error) {
      logError(`Erro ao testar servidor: ${error.message}`);
      resolve(false);
    }
  });
};

// Gerar relatório de status
const generateReport = (results) => {
  logStep('RELATÓRIO FINAL', 'Status do setup');
  
  log('\n==========================================', 'magenta');
  log('           RELATÓRIO DE SETUP', 'magenta');
  log('==========================================', 'magenta');
  
  const statuses = [
    { name: 'Estrutura de diretórios', status: true },
    { name: 'Dependências Node.js', status: results.dependencies },
    { name: 'Arquivo .env', status: results.env },
    { name: 'Conexão com banco', status: results.database },
    { name: 'Tabelas básicas', status: results.tables },
    { name: 'Servidor funcional', status: results.server }
  ];
  
  statuses.forEach(item => {
    const icon = item.status ? '✅' : '❌';
    const color = item.status ? 'green' : 'red';
    log(`${icon} ${item.name}`, color);
  });
  
  const successCount = statuses.filter(s => s.status).length;
  const totalCount = statuses.length;
  const percentage = Math.round((successCount / totalCount) * 100);
  
  log(`\n📊 Setup ${percentage}% completo (${successCount}/${totalCount})`, 'cyan');
  
  if (percentage >= 80) {
    log('\n🎉 SETUP QUASE COMPLETO!', 'green');
    log('Próximos passos:', 'yellow');
    log('1. Implemente os arquivos faltantes usando os artifacts', 'white');
    log('2. Execute: npm run server', 'white');
    log('3. Teste: ./scripts/test-phase0.sh', 'white');
  } else {
    log('\n⚠️ SETUP INCOMPLETO', 'yellow');
    log('Resolva os problemas marcados com ❌ antes de continuar', 'white');
  }
  
  log('\n==========================================\n', 'magenta');
};

// Função principal
const main = async () => {
  log('🚀 SETUP AUTOMÁTICO DO MATCHIT - FASE 0', 'magenta');
  log('==========================================\n', 'magenta');
  
  const results = {};
  
  try {
    checkProjectRoot();
    createDirectories();
    
    results.dependencies = true;
    try {
      installDependencies();
    } catch (error) {
      results.dependencies = false;
    }
    
    checkEnvFile();
    results.env = fs.existsSync('.env');
    
    results.database = await testDatabase();
    results.tables = results.database ? await createBasicTables() : false;
    results.server = await testServer();
    
    generateReport(results);
    
  } catch (error) {
    logError(`Erro durante setup: ${error.message}`);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export default { main };