// scripts/run-migrations.js - Executor de Migrações MatchIt
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Configuração do banco
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'matchit_db',
  user: process.env.DB_USER || 'matchit',
  password: process.env.DB_PASSWORD || 'matchit123',
};

// Ordem de execução das migrações por prioridade
const EXECUTION_ORDER = ['critical', 'high', 'medium', 'low'];
const CATEGORY_ORDER = ['core', 'features', 'data', 'indexes', 'cleanup'];

// Inicializar sistema de controle de migrações
const initializeMigrationSystem = async (client) => {
  log('🔧 INICIALIZANDO SISTEMA DE MIGRAÇÕES', 'magenta');
  log('====================================\n', 'magenta');
  
  try {
    // Criar tabela de controle de migrações
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW(),
        checksum VARCHAR(64),
        description TEXT,
        category VARCHAR(50),
        priority VARCHAR(20),
        execution_time_ms INTEGER,
        sql_content TEXT
      )
    `);
    
    // Criar tabela de logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_logs (
        id SERIAL PRIMARY KEY,
        migration_version VARCHAR(255) NOT NULL,
        action VARCHAR(20) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW(),
        execution_time_ms INTEGER,
        error_message TEXT,
        sql_executed TEXT
      )
    `);
    
    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_logs_version 
      ON migration_logs(migration_version)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at 
      ON migration_logs(executed_at)
    `);
    
    log('✅ Sistema de controle inicializado', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro ao inicializar sistema: ${error.message}`, 'red');
    throw error;
  }
};

// Carregar lista de migrações disponíveis
const loadAvailableMigrations = () => {
  log('📋 CARREGANDO MIGRAÇÕES DISPONÍVEIS', 'cyan');
  log('==================================\n', 'cyan');
  
  const migrations = [];
  const basePath = 'database/migrations';
  
  if (!fs.existsSync(basePath)) {
    log('⚠️ Diretório de migrações não encontrado', 'yellow');
    return migrations;
  }
  
  // Percorrer categorias em ordem
  CATEGORY_ORDER.forEach(category => {
    const categoryPath = path.join(basePath, category);
    
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      files.forEach(file => {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extrair metadados do arquivo
        const versionMatch = file.match(/^(\d+)_(.+)\.sql$/);
        const version = versionMatch ? versionMatch[1] : file.replace('.sql', '');
        const name = versionMatch ? versionMatch[2] : file.replace('.sql', '');
        
        // Detectar prioridade baseada no conteúdo
        let priority = 'medium';
        if (content.includes('CREATE TABLE users') || content.includes('schema_migrations')) {
          priority = 'critical';
        } else if (content.includes('CREATE TABLE') && category === 'core') {
          priority = 'high';
        } else if (content.includes('CREATE INDEX') || category === 'indexes') {
          priority = 'low';
        }
        
        // Extrair descrição do comentário
        const descriptionMatch = content.match(/--\s*(.+)/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : name.replace(/_/g, ' ');
        
        migrations.push({
          version,
          filename: file,
          filepath: filePath,
          name,
          description,
          category,
          priority,
          content,
          checksum: crypto.createHash('md5').update(content).digest('hex')
        });
        
        log(`📄 ${file} (${category}/${priority})`, 'white');
      });
    }
  });
  
  // Ordenar por prioridade e versão
  migrations.sort((a, b) => {
    const priorityA = EXECUTION_ORDER.indexOf(a.priority);
    const priorityB = EXECUTION_ORDER.indexOf(b.priority);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    const categoryA = CATEGORY_ORDER.indexOf(a.category);
    const categoryB = CATEGORY_ORDER.indexOf(b.category);
    
    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }
    
    return a.version.localeCompare(b.version);
  });
  
  log(`\n📊 Total: ${migrations.length} migrações encontradas\n`, 'cyan');
  return migrations;
};

// Verificar migrações já executadas
const getExecutedMigrations = async (client) => {
  try {
    const result = await client.query(`
      SELECT version, filename, executed_at, checksum 
      FROM schema_migrations 
      ORDER BY executed_at
    `);
    
    return new Set(result.rows.map(row => row.version));
    
  } catch (error) {
    // Tabela ainda não existe
    return new Set();
  }
};

// Executar uma migração
const executeMigration = async (client, migration) => {
  const startTime = Date.now();
  
  try {
    log(`🔄 Executando: ${migration.filename}`, 'blue');
    log(`   Descrição: ${migration.description}`, 'white');
    
    // Executar migração em transação
    await client.query('BEGIN');
    
    // Executar SQL da migração
    await client.query(migration.content);
    
    // Registrar migração como executada
    await client.query(`
      INSERT INTO schema_migrations 
      (version, filename, checksum, description, category, priority, execution_time_ms, sql_content)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (version) DO UPDATE SET
        executed_at = NOW(),
        checksum = EXCLUDED.checksum,
        execution_time_ms = EXCLUDED.execution_time_ms
    `, [
      migration.version,
      migration.filename,
      migration.checksum,
      migration.description,
      migration.category,
      migration.priority,
      Date.now() - startTime,
      migration.content
    ]);
    
    // Log de sucesso
    await client.query(`
      INSERT INTO migration_logs 
      (migration_version, action, execution_time_ms, sql_executed)
      VALUES ($1, 'up', $2, $3)
    `, [migration.version, Date.now() - startTime, migration.content]);
    
    await client.query('COMMIT');
    
    const executionTime = Date.now() - startTime;
    log(`   ✅ Sucesso (${executionTime}ms)`, 'green');
    
    return { success: true, executionTime };
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Log de erro
    try {
      await client.query(`
        INSERT INTO migration_logs 
        (migration_version, action, execution_time_ms, error_message, sql_executed)
        VALUES ($1, 'failed', $2, $3, $4)
      `, [migration.version, Date.now() - startTime, error.message, migration.content]);
    } catch (logError) {
      log(`⚠️ Erro ao registrar log: ${logError.message}`, 'yellow');
    }
    
    log(`   ❌ Erro: ${error.message}`, 'red');
    throw error;
  }
};

// Executar migrações pendentes
const runPendingMigrations = async (client, migrations, executedMigrations) => {
  log('🚀 EXECUTANDO MIGRAÇÕES PENDENTES', 'magenta');
  log('=================================\n', 'magenta');
  
  const pendingMigrations = migrations.filter(m => !executedMigrations.has(m.version));
  
  if (pendingMigrations.length === 0) {
    log('✅ Nenhuma migração pendente', 'green');
    return { executed: 0, failed: 0 };
  }
  
  log(`📊 ${pendingMigrations.length} migrações pendentes:\n`, 'cyan');
  
  let executed = 0;
  let failed = 0;
  
  for (const migration of pendingMigrations) {
    try {
      await executeMigration(client, migration);
      executed++;
    } catch (error) {
      failed++;
      
      // Perguntar se deve continuar em caso de erro
      if (migration.priority === 'critical') {
        log('❌ Migração crítica falhou - abortando execução', 'red');
        break;
      }
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('⚠️ Continuar com próximas migrações? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        log('❌ Execução abortada pelo usuário', 'yellow');
        break;
      }
    }
  }
  
  return { executed, failed };
};

// Verificar integridade das migrações
const verifyMigrations = async (client, migrations) => {
  log('\n🔍 VERIFICANDO INTEGRIDADE', 'cyan');
  log('==========================\n', 'cyan');
  
  try {
    const result = await client.query(`
      SELECT version, filename, checksum 
      FROM schema_migrations
    `);
    
    const executedMigrations = new Map(
      result.rows.map(row => [row.version, row])
    );
    
    let issues = 0;
    
    migrations.forEach(migration => {
      const executed = executedMigrations.get(migration.version);
      
      if (executed) {
        if (executed.checksum !== migration.checksum) {
          log(`⚠️ Checksum diferente: ${migration.filename}`, 'yellow');
          log(`   Executado: ${executed.checksum}`, 'white');
          log(`   Arquivo:   ${migration.checksum}`, 'white');
          issues++;
        }
      }
    });
    
    if (issues === 0) {
      log('✅ Todas as migrações estão íntegras', 'green');
    } else {
      log(`⚠️ ${issues} problemas de integridade encontrados`, 'yellow');
    }
    
    return issues;
    
  } catch (error) {
    log(`❌ Erro na verificação: ${error.message}`, 'red');
    return -1;
  }
};

// Gerar relatório de status
const generateStatusReport = async (client, migrations) => {
  log('\n📊 RELATÓRIO DE STATUS', 'magenta');
  log('====================\n', 'magenta');
  
  try {
    // Estatísticas gerais
    const executedResult = await client.query('SELECT COUNT(*) FROM schema_migrations');
    const executedCount = parseInt(executedResult.rows[0].count);
    
    const pendingCount = migrations.length - executedCount;
    
    log(`📋 Total de migrações: ${migrations.length}`, 'cyan');
    log(`✅ Executadas: ${executedCount}`, 'green');
    log(`⏳ Pendentes: ${pendingCount}`, 'yellow');
    
    // Estatísticas por categoria
    const categoryStats = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM schema_migrations 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    log('\n📊 Por categoria:', 'cyan');
    categoryStats.rows.forEach(row => {
      log(`   ${row.category}: ${row.count}`, 'white');
    });
    
    // Últimas migrações executadas
    const recentMigrations = await client.query(`
      SELECT filename, executed_at, execution_time_ms 
      FROM schema_migrations 
      ORDER BY executed_at DESC 
      LIMIT 5
    `);
    
    log('\n⏰ Últimas executadas:', 'cyan');
    recentMigrations.rows.forEach(row => {
      log(`   ${row.filename} (${row.execution_time_ms}ms)`, 'white');
    });
    
    // Logs de erro recentes
    const errorLogs = await client.query(`
      SELECT migration_version, error_message, executed_at 
      FROM migration_logs 
      WHERE action = 'failed' 
      ORDER BY executed_at DESC 
      LIMIT 3
    `);
    
    if (errorLogs.rows.length > 0) {
      log('\n❌ Erros recentes:', 'red');
      errorLogs.rows.forEach(row => {
        log(`   ${row.migration_version}: ${row.error_message}`, 'red');
      });
    }
    
  } catch (error) {
    log(`❌ Erro ao gerar relatório: ${error.message}`, 'red');
  }
};

// Função principal
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  log('🚀 EXECUTOR DE MIGRAÇÕES - MATCHIT', 'magenta');
  log('==================================\n', 'magenta');
  
  try {
    // Conectar ao banco
    const client = new Client(dbConfig);
    await client.connect();
    log('✅ Conectado ao banco de dados\n', 'green');
    
    // Inicializar sistema de migrações
    await initializeMigrationSystem(client);
    
    // Carregar migrações
    const migrations = loadAvailableMigrations();
    const executedMigrations = await getExecutedMigrations(client);
    
    switch (command) {
      case 'run':
        const result = await runPendingMigrations(client, migrations, executedMigrations);
        log(`\n🎉 Execução concluída: ${result.executed} executadas, ${result.failed} falharam`, 'green');
        break;
        
      case 'status':
        await generateStatusReport(client, migrations);
        break;
        
      case 'verify':
        await verifyMigrations(client, migrations);
        break;
        
      case 'force':
        const migrationVersion = args[1];
        if (!migrationVersion) {
          log('❌ Especifique a versão da migração para forçar execução', 'red');
          process.exit(1);
        }
        
        const migration = migrations.find(m => m.version === migrationVersion);
        if (!migration) {
          log(`❌ Migração ${migrationVersion} não encontrada`, 'red');
          process.exit(1);
        }
        
        log(`⚠️ Forçando execução: ${migration.filename}`, 'yellow');
        await executeMigration(client, migration);
        break;
        
      default:
        log('❌ Comando inválido. Use: run, status, verify, force <version>', 'red');
        process.exit(1);
    }
    
    await client.end();
    log('\n✅ Processo concluído', 'green');
    
  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { 
  main, 
  loadAvailableMigrations, 
  executeMigration, 
  initializeMigrationSystem 
};