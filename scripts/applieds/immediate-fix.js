// scripts/immediate-fix.js - Correção Imediata Completa do MatchIt
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, color = 'white') => {
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
};

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'matchit_db',
  user: process.env.DB_USER || 'matchit',
  password: process.env.DB_PASSWORD || 'matchit123',
};

// Analisar migrações disponíveis (versão corrigida)
const analyzeMigrations = () => {
  log('🔍 ANALISANDO MIGRAÇÕES DISPONÍVEIS', 'magenta');
  log('====================================\n', 'magenta');

  const migrationPath = 'database/migrations';
  const migrations = [];

  if (!fs.existsSync(migrationPath)) {
    log('⚠️ Diretório database/migrations não existe', 'yellow');
    return migrations;
  }

  const files = fs.readdirSync(migrationPath);
  
  files.forEach(file => {
    const fullPath = path.join(migrationPath, file);
    const stats = fs.statSync(fullPath);
    
    // Só processar arquivos SQL
    if (stats.isFile() && file.endsWith('.sql')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Análise básica do conteúdo
        const analysis = {
          file,
          path: fullPath,
          size: stats.size,
          hasCreateTable: content.includes('CREATE TABLE'),
          hasAlterTable: content.includes('ALTER TABLE'),
          hasUsers: content.includes('users'),
          hasEmotional: content.includes('emotional'),
          hasStyleChoices: content.includes('style_choices'),
          lineCount: content.split('\n').length
        };
        
        migrations.push(analysis);
        
        const type = analysis.hasCreateTable ? 'CREATE' : 
                    analysis.hasAlterTable ? 'ALTER' : 'OTHER';
        
        log(`   📄 ${file} (${stats.size}b, ${type})`, 'white');
        
        if (analysis.hasUsers) log(`      🔹 Contém: users`, 'cyan');
        if (analysis.hasStyleChoices) log(`      🔹 Contém: style_choices`, 'cyan');
        if (analysis.hasEmotional) log(`      🔹 Contém: emotional_*`, 'cyan');
        
      } catch (error) {
        log(`   ❌ Erro ao ler ${file}: ${error.message}`, 'red');
      }
    }
  });

  log(`\n📊 Total: ${migrations.length} migrações encontradas\n`, 'cyan');
  return migrations;
};

// Verificar estado do banco
const checkDatabaseState = async (client) => {
  log('🗄️ VERIFICANDO ESTADO DO BANCO', 'magenta');
  log('==============================\n', 'magenta');

  try {
    // Verificar tabelas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    log(`📊 ${tables.rows.length} tabelas encontradas:`, 'cyan');
    tables.rows.forEach(row => {
      log(`   📋 ${row.table_name}`, 'white');
    });

    // Verificar especificamente tabela users
    const usersExists = tables.rows.some(row => row.table_name === 'users');
    
    if (usersExists) {
      log('\n👤 Analisando tabela users:', 'blue');
      
      const userColumns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);

      log('   Colunas:', 'cyan');
      userColumns.rows.forEach(col => {
        log(`      - ${col.column_name} (${col.data_type})`, 'white');
      });

      const hasPassword = userColumns.rows.some(col => col.column_name === 'password');
      const hasEmail = userColumns.rows.some(col => col.column_name === 'email');
      const hasName = userColumns.rows.some(col => col.column_name === 'name');

      log('\n   Status das colunas críticas:', 'cyan');
      log(`      ${hasEmail ? '✅' : '❌'} email`, hasEmail ? 'green' : 'red');
      log(`      ${hasPassword ? '✅' : '❌'} password`, hasPassword ? 'green' : 'red');
      log(`      ${hasName ? '✅' : '❌'} name`, hasName ? 'green' : 'red');

      return { hasUsers: true, hasPassword, hasEmail, hasName };
    } else {
      log('\n❌ Tabela users NÃO existe', 'red');
      return { hasUsers: false, hasPassword: false, hasEmail: false, hasName: false };
    }

  } catch (error) {
    log(`❌ Erro ao verificar banco: ${error.message}`, 'red');
    return { hasUsers: false, hasPassword: false, hasEmail: false, hasName: false };
  }
};

// Corrigir problemas básicos
const fixBasicIssues = async (client, dbState) => {
  log('\n🔧 CORRIGINDO PROBLEMAS BÁSICOS', 'magenta');
  log('===============================\n', 'magenta');

  try {
    // Criar tabela users se não existir
    if (!dbState.hasUsers) {
      log('🔨 Criando tabela users...', 'yellow');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      log('✅ Tabela users criada', 'green');
    } else {
      // Adicionar colunas faltantes
      if (!dbState.hasPassword) {
        log('🔨 Adicionando coluna password...', 'yellow');
        await client.query('ALTER TABLE users ADD COLUMN password VARCHAR(255)');
        log('✅ Coluna password adicionada', 'green');
      }

      if (!dbState.hasName) {
        log('🔨 Adicionando coluna name...', 'yellow');
        await client.query('ALTER TABLE users ADD COLUMN name VARCHAR(255)');
        log('✅ Coluna name adicionada', 'green');
      }
    }

    // Criar constraint UNIQUE no email se não existir
    try {
      await client.query('ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)');
      log('✅ Constraint UNIQUE adicionada ao email', 'green');
    } catch (error) {
      if (error.message.includes('already exists')) {
        log('⚠️ Email já é único', 'yellow');
      }
    }

    // Criar tabela style_choices
    log('\n📋 Verificando tabela style_choices...', 'blue');
    const styleTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'style_choices'
      )
    `);

    if (!styleTableExists.rows[0].exists) {
      log('🔨 Criando tabela style_choices...', 'yellow');
      await client.query(`
        CREATE TABLE style_choices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          question_id VARCHAR(100) NOT NULL,
          selected_option VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, category, question_id)
        )
      `);

      await client.query('CREATE INDEX idx_style_choices_user_id ON style_choices(user_id)');
      log('✅ Tabela style_choices criada', 'green');
    } else {
      log('✅ Tabela style_choices já existe', 'green');
    }

    // Criar usuário de teste
    log('\n👤 Verificando usuário de teste...', 'blue');
    const userCheck = await client.query(`
      SELECT COUNT(*) FROM users WHERE email = 'test@test.com'
    `);

    if (parseInt(userCheck.rows[0].count) === 0) {
      log('🔨 Criando usuário de teste...', 'yellow');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      await client.query(`
        INSERT INTO users (email, password, name, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW())
      `, ['test@test.com', hashedPassword, 'Usuário de Teste']);
      
      log('✅ Usuário criado: test@test.com / senha: test123', 'green');
    } else {
      log('✅ Usuário de teste já existe', 'green');
    }

    return true;

  } catch (error) {
    log(`❌ Erro ao corrigir problemas: ${error.message}`, 'red');
    return false;
  }
};

// Testar sistema corrigido
const testSystem = async (client) => {
  log('\n🧪 TESTANDO SISTEMA CORRIGIDO', 'magenta');
  log('==============================\n', 'magenta');

  try {
    // Teste 1: Verificar estrutura da tabela users
    log('🔍 Teste 1: Estrutura da tabela users', 'blue');
    const userStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    const requiredColumns = ['id', 'email', 'password', 'name'];
    const hasAllColumns = requiredColumns.every(col => 
      userStructure.rows.some(row => row.column_name === col)
    );

    log(`   ${hasAllColumns ? '✅' : '❌'} Todas as colunas necessárias presentes`, 
        hasAllColumns ? 'green' : 'red');

    // Teste 2: Verificar usuário de teste
    log('\n🔍 Teste 2: Usuário de teste', 'blue');
    const testUser = await client.query(`
      SELECT id, email, name, 
             CASE WHEN password IS NOT NULL THEN 'OK' ELSE 'NULL' END as password_status
      FROM users 
      WHERE email = 'test@test.com'
    `);

    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      log(`   ✅ Usuário encontrado: ${user.name} (${user.email})`, 'green');
      log(`   ✅ Status senha: ${user.password_status}`, 'green');
    } else {
      log('   ❌ Usuário de teste não encontrado', 'red');
    }

    // Teste 3: Verificar tabela style_choices
    log('\n🔍 Teste 3: Tabela style_choices', 'blue');
    const styleTest = await client.query(`
      SELECT COUNT(*) FROM style_choices
    `);
    log(`   ✅ Tabela style_choices acessível (${styleTest.rows[0].count} registros)`, 'green');

    return hasAllColumns && testUser.rows.length > 0;

  } catch (error) {
    log(`❌ Erro nos testes: ${error.message}`, 'red');
    return false;
  }
};

// Função principal
const main = async () => {
  log('⚡ CORREÇÃO IMEDIATA COMPLETA - MATCHIT', 'magenta');
  log('======================================\n', 'magenta');

  try {
    // 1. Analisar migrações disponíveis
    const migrations = analyzeMigrations();

    // 2. Conectar ao banco
    const client = new Client(dbConfig);
    await client.connect();
    log('✅ Conectado ao banco de dados\n', 'green');

    // 3. Verificar estado atual
    const dbState = await checkDatabaseState(client);

    // 4. Corrigir problemas básicos
    const fixResult = await fixBasicIssues(client, dbState);

    if (!fixResult) {
      log('❌ Falha na correção de problemas básicos', 'red');
      await client.end();
      return;
    }

    // 5. Testar sistema
    const testResult = await testSystem(client);

    // 6. Relatório final
    log('\n📊 RELATÓRIO FINAL', 'magenta');
    log('================\n', 'magenta');

    log(`📁 Migrações encontradas: ${migrations.length}`, 'cyan');
    log(`✅ Problemas básicos corrigidos: ${fixResult ? 'SIM' : 'NÃO'}`, 
        fixResult ? 'green' : 'red');
    log(`🧪 Testes passaram: ${testResult ? 'SIM' : 'NÃO'}`, 
        testResult ? 'green' : 'red');

    if (testResult) {
      log('\n🎉 SISTEMA CORRIGIDO COM SUCESSO!', 'green');
      log('\n🚀 PRÓXIMOS PASSOS:', 'cyan');
      log('1. Reiniciar servidor: npm run server', 'white');
      log('2. Testar login:', 'white');
      log('   curl -X POST http://localhost:3001/api/auth/login \\', 'white');
      log('     -H "Content-Type: application/json" \\', 'white');
      log('     -d \'{"email":"test@test.com","password":"test123"}\'', 'white');
      log('3. Executar teste da Fase 0: ./scripts/test-phase0.sh', 'white');
      log('4. Organizar migrações: node scripts/organize-migrations.js', 'white');
    } else {
      log('\n⚠️ Alguns problemas ainda existem', 'yellow');
      log('Verifique os logs acima para detalhes', 'white');
    }

    await client.end();

  } catch (error) {
    log(`❌ ERRO FATAL: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };