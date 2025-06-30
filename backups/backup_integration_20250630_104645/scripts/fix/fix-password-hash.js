// scripts/fix-password-hash.js - Correção do Problema de Hash da Senha
require('dotenv').config();
import { Client  } from 'pg';
import bcrypt from 'bcrypt';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

const main = async () => {
  log('🔐 CORREÇÃO DO PROBLEMA DE HASH DA SENHA', 'cyan');
  log('==========================================\n', 'cyan');

  const client = new Client(dbConfig);

  try {
    await client.connect();
    log('✅ Conectado ao banco\n', 'green');

    // 1. Verificar usuário test@test.com
    log('🔍 Verificando usuário test@test.com...', 'blue');
    const userCheck = await client.query(`
      SELECT id, email, name, password, 
             CASE 
               WHEN password IS NULL THEN 'NULL'
               WHEN password = '' THEN 'EMPTY'
               WHEN LENGTH(password) < 10 THEN 'TOO_SHORT'
               ELSE 'OK'
             END as password_status
      FROM users 
      WHERE email = 'test@test.com'
    `);

    if (userCheck.rows.length === 0) {
      log('❌ Usuário test@test.com não existe', 'red');
      log('🔨 Criando usuário...', 'yellow');
      
      const hashedPassword = await bcrypt.hash('test123', 10);
      await client.query(`
        INSERT INTO users (email, password, name, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW())
      `, ['test@test.com', hashedPassword, 'Usuário de Teste']);
      
      log('✅ Usuário criado com sucesso', 'green');
      
    } else {
      const user = userCheck.rows[0];
      log(`📋 Usuário encontrado: ${user.name} (ID: ${user.id})`, 'white');
      log(`🔐 Status da senha: ${user.password_status}`, 
          user.password_status === 'OK' ? 'green' : 'red');
      
      if (user.password_status !== 'OK') {
        log('🔨 Corrigindo senha...', 'yellow');
        
        const newHashedPassword = await bcrypt.hash('test123', 10);
        await client.query(`
          UPDATE users 
          SET password = $1, updated_at = NOW() 
          WHERE email = 'test@test.com'
        `, [newHashedPassword]);
        
        log('✅ Senha corrigida com sucesso', 'green');
      } else {
        log('✅ Senha já está correta', 'green');
      }
    }

    // 2. Testar hash da senha
    log('\n🧪 Testando hash da senha...', 'blue');
    const testUser = await client.query(`
      SELECT password FROM users WHERE email = 'test@test.com'
    `);
    
    const storedHash = testUser.rows[0].password;
    const testPassword = 'test123';
    
    try {
      const isValid = await bcrypt.compare(testPassword, storedHash);
      log(`✅ Teste de comparação bcrypt: ${isValid ? 'SUCESSO' : 'FALHA'}`, 
          isValid ? 'green' : 'red');
      
      if (!isValid) {
        log('🔨 Regenerando hash...', 'yellow');
        const newHash = await bcrypt.hash(testPassword, 10);
        await client.query(`
          UPDATE users SET password = $1 WHERE email = 'test@test.com'
        `, [newHash]);
        log('✅ Hash regenerado', 'green');
      }
    } catch (error) {
      log(`❌ Erro no teste bcrypt: ${error.message}`, 'red');
      log('🔨 Criando novo hash...', 'yellow');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      await client.query(`
        UPDATE users SET password = $1 WHERE email = 'test@test.com'
      `, [newHash]);
      log('✅ Novo hash criado', 'green');
    }

    // 3. Verificação final
    log('\n🔍 Verificação final...', 'blue');
    const finalCheck = await client.query(`
      SELECT id, email, name, 
             CASE WHEN password IS NOT NULL AND LENGTH(password) > 10 THEN 'OK' ELSE 'PROBLEM' END as status
      FROM users 
      WHERE email = 'test@test.com'
    `);
    
    const user = finalCheck.rows[0];
    log(`📋 ${user.email}: ${user.status}`, user.status === 'OK' ? 'green' : 'red');

    // 4. Teste de login via API (porta correta)
    log('\n🌐 Testando login via API...', 'blue');
    log('📍 Servidor na porta 3000 (corrigido)', 'cyan');
    
    const testLogin = `curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@test.com","password":"test123"}'`;
    
    log('🔧 Comando para testar:', 'cyan');
    log(testLogin, 'white');

    // 5. Relatório final
    log('\n📊 CORREÇÃO CONCLUÍDA', 'cyan');
    log('===================', 'cyan');
    log('✅ Usuário: test@test.com', 'green');
    log('✅ Senha: test123', 'green');
    log('✅ Hash: Corrigido', 'green');
    log('✅ Porta: 3000 (identificada)', 'green');

    log('\n🚀 TESTE AGORA:', 'cyan');
    log('Execute o comando curl acima ou:', 'white');
    log('./scripts/test-phase0.sh (após atualizar porta)', 'white');

    await client.end();

  } catch (error) {
    log(`❌ ERRO: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
};

main();