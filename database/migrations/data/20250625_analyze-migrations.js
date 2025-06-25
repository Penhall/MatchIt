// scripts/analyze-migrations.js - Analisador Completo de Migrações MatchIt
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
  white: '\x1b[37m',
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

// Pastas a serem analisadas
const migrationPaths = [
  'database/migrations',
  'scripts/migrations', 
  'scripts',
  'server/migrations'
];

// Análise de arquivos de migração
const analyzeMigrationFiles = () => {
  log('🔍 ANALISANDO ARQUIVOS DE MIGRAÇÃO', 'magenta');
  log('=====================================\n', 'magenta');

  const foundFiles = [];
  
  migrationPaths.forEach(dirPath => {
    log(`📁 Analisando: ${dirPath}`, 'blue');
    
    if (!fs.existsSync(dirPath)) {
      log(`   ❌ Diretório não existe`, 'red');
      return;
    }
    
    const files = fs.readdirSync(dirPath);
    const migrationFiles = files.filter(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      
      // Só processar arquivos, não diretórios
      if (!stats.isFile()) {
        return false;
      }
      
      return (
        file.endsWith('.sql') || 
        file.includes('migration') || 
        file.includes('schema') ||
        file.includes('create') ||
        file.includes('alter') ||
        (file.endsWith('.js') && (file.includes('migrate') || file.includes('setup')))
      );
    });
    
    if (migrationFiles.length === 0) {
      log(`   ⚠️ Nenhum arquivo de migração encontrado`, 'yellow');
    } else {
      migrationFiles.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        
        // Verificação dupla para garantir que é arquivo
        if (!stats.isFile()) {
          log(`   ⚠️ Pulando diretório: ${file}`, 'yellow');
          return;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Detectar tipo de migração
        let migrationType = 'unknown';
        let description = '';
        let priority = 'low';
        
        if (content.includes('CREATE TABLE')) {
          migrationType = 'create_table';
          priority = 'high';
        } else if (content.includes('ALTER TABLE')) {
          migrationType = 'alter_table';
          priority = 'medium';
        } else if (content.includes('DROP TABLE')) {
          migrationType = 'drop_table';
          priority = 'critical';
        } else if (content.includes('INSERT INTO')) {
          migrationType = 'seed_data';
          priority = 'low';
        } else if (content.includes('CREATE INDEX')) {
          migrationType = 'create_index';
          priority = 'low';
        } else if (file.includes('setup') || file.includes('fix')) {
          migrationType = 'utility_script';
          priority = 'medium';
        }
        
        // Extrair descrição do comentário
        const commentMatch = content.match(/--\s*(.*)/);
        if (commentMatch) {
          description = commentMatch[1].trim();
        }
        
        // Detectar tabelas afetadas
        const tableMatches = content.match(/(?:CREATE|ALTER|DROP)\s+TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(\w+)/gi);
        const tables = tableMatches ? tableMatches.map(match => 
          match.replace(/(?:CREATE|ALTER|DROP)\s+TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?/i, '').trim()
        ) : [];
        
        foundFiles.push({
          file,
          fullPath,
          directory: dirPath,
          size: stats.size,
          modified: stats.mtime,
          type: migrationType,
          priority,
          description,
          tables,
          hasCreateTable: content.includes('CREATE TABLE'),
          hasAlterTable: content.includes('ALTER TABLE'),
          hasDropTable: content.includes('DROP TABLE'),
          hasInsert: content.includes('INSERT INTO'),
          hasFunction: content.includes('CREATE FUNCTION'),
          hasTrigger: content.includes('CREATE TRIGGER'),
          hasIndex: content.includes('CREATE INDEX'),
          lineCount: content.split('\n').length
        });
        
        log(`   ✅ ${file} (${stats.size} bytes, ${migrationType})`, 'green');
      });
    }
    log('');
  });
  
  return foundFiles;
};

// Verificar migrações executadas no banco
const checkExecutedMigrations = async (client) => {
  log('🗄️ VERIFICANDO MIGRAÇÕES EXECUTADAS NO BANCO', 'magenta');
  log('===============================================\n', 'magenta');
  
  try {
    // Verificar se tabela de controle de migrações existe
    const migrationTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      )
    `);
    
    if (!migrationTableExists.rows[0].exists) {
      log('⚠️ Tabela schema_migrations não existe - sistema sem controle de migrações', 'yellow');
      
      // Criar tabela de controle
      await client.query(`
        CREATE TABLE schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR(64),
          description TEXT
        )
      `);
      log('✅ Tabela schema_migrations criada', 'green');
      return [];
    }
    
    const executedMigrations = await client.query(`
      SELECT version, filename, executed_at, description 
      FROM schema_migrations 
      ORDER BY executed_at
    `);
    
    log(`📋 ${executedMigrations.rows.length} migrações executadas:`, 'cyan');
    executedMigrations.rows.forEach(row => {
      log(`   ✅ ${row.version} - ${row.filename} (${row.executed_at})`, 'green');
    });
    
    return executedMigrations.rows;
    
  } catch (error) {
    log(`❌ Erro ao verificar migrações: ${error.message}`, 'red');
    return [];
  }
};

// Analisar estado atual do banco
const analyzeDatabaseState = async (client) => {
  log('\n🏗️ ANALISANDO ESTADO ATUAL DO BANCO', 'magenta');
  log('===================================\n', 'magenta');
  
  try {
    // Listar todas as tabelas
    const tables = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    log(`📊 ${tables.rows.length} tabelas encontradas:`, 'cyan');
    tables.rows.forEach(row => {
      log(`   📋 ${row.table_name} (${row.table_type})`, 'white');
    });
    
    // Verificar colunas críticas
    log('\n🔍 Verificando estruturas críticas:', 'blue');
    
    // Tabela users
    try {
      const userColumns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      log(`   👤 users: ${userColumns.rows.length} colunas`, 'white');
      const hasPassword = userColumns.rows.some(col => col.column_name === 'password');
      const hasEmail = userColumns.rows.some(col => col.column_name === 'email');
      log(`      ${hasEmail ? '✅' : '❌'} email`, hasEmail ? 'green' : 'red');
      log(`      ${hasPassword ? '✅' : '❌'} password`, hasPassword ? 'green' : 'red');
      
    } catch (error) {
      log(`   ❌ Tabela users não existe`, 'red');
    }
    
    // Verificar outras tabelas críticas
    const criticalTables = ['style_choices', 'emotional_profiles', 'user_profiles'];
    for (const tableName of criticalTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        log(`   📋 ${tableName}: ${result.rows[0].count} registros`, 'white');
      } catch (error) {
        log(`   ❌ ${tableName}: não existe`, 'red');
      }
    }
    
    return tables.rows;
    
  } catch (error) {
    log(`❌ Erro ao analisar banco: ${error.message}`, 'red');
    return [];
  }
};

// Gerar relatório de conflitos
const generateConflictReport = (files, executedMigrations, databaseTables) => {
  log('\n⚠️ RELATÓRIO DE CONFLITOS E PROBLEMAS', 'magenta');
  log('=====================================\n', 'magenta');
  
  const conflicts = [];
  const duplicates = [];
  const orphans = [];
  
  // Detectar arquivos duplicados
  const filesByContent = {};
  files.forEach(file => {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const signature = content.replace(/\s+/g, '').substring(0, 200);
    
    if (filesByContent[signature]) {
      duplicates.push({
        original: filesByContent[signature],
        duplicate: file
      });
    } else {
      filesByContent[signature] = file;
    }
  });
  
  // Detectar arquivos órfãos (não executados)
  const executedFilenames = executedMigrations.map(m => m.filename);
  files.forEach(file => {
    if (!executedFilenames.includes(file.file) && 
        file.type !== 'utility_script' && 
        file.hasCreateTable) {
      orphans.push(file);
    }
  });
  
  // Detectar conflitos de tabelas
  const tableCreations = {};
  files.forEach(file => {
    file.tables.forEach(table => {
      if (file.hasCreateTable) {
        if (tableCreations[table]) {
          conflicts.push({
            type: 'table_conflict',
            table,
            files: [tableCreations[table], file]
          });
        } else {
          tableCreations[table] = file;
        }
      }
    });
  });
  
  // Exibir relatório
  if (duplicates.length > 0) {
    log('🔄 ARQUIVOS DUPLICADOS:', 'yellow');
    duplicates.forEach(dup => {
      log(`   ⚠️ ${dup.original.fullPath}`, 'yellow');
      log(`   ⚠️ ${dup.duplicate.fullPath}`, 'yellow');
      log('');
    });
  }
  
  if (conflicts.length > 0) {
    log('💥 CONFLITOS DE TABELAS:', 'red');
    conflicts.forEach(conflict => {
      log(`   ❌ Tabela '${conflict.table}' criada em múltiplos arquivos:`, 'red');
      conflict.files.forEach(file => {
        log(`      - ${file.fullPath}`, 'white');
      });
      log('');
    });
  }
  
  if (orphans.length > 0) {
    log('👻 MIGRAÇÕES ÓRFÃS (não executadas):', 'cyan');
    orphans.forEach(orphan => {
      log(`   📄 ${orphan.fullPath}`, 'cyan');
      log(`      Tipo: ${orphan.type}, Tabelas: ${orphan.tables.join(', ')}`, 'white');
    });
    log('');
  }
  
  return { conflicts, duplicates, orphans };
};

// Função principal
const main = async () => {
  log('🔍 ANALISADOR DE MIGRAÇÕES - MATCHIT', 'magenta');
  log('===================================\n', 'magenta');
  
  try {
    // 1. Analisar arquivos de migração
    const files = analyzeMigrationFiles();
    
    // 2. Conectar ao banco e verificar estado
    const client = new Client(dbConfig);
    await client.connect();
    log('✅ Conectado ao banco de dados\n', 'green');
    
    const executedMigrations = await checkExecutedMigrations(client);
    const databaseTables = await analyzeDatabaseState(client);
    
    // 3. Gerar relatório de conflitos
    const report = generateConflictReport(files, executedMigrations, databaseTables);
    
    // 4. Estatísticas finais
    log('\n📊 ESTATÍSTICAS FINAIS', 'magenta');
    log('====================\n', 'magenta');
    
    log(`📁 Diretórios analisados: ${migrationPaths.length}`, 'cyan');
    log(`📄 Arquivos encontrados: ${files.length}`, 'cyan');
    log(`✅ Migrações executadas: ${executedMigrations.length}`, 'green');
    log(`📋 Tabelas no banco: ${databaseTables.length}`, 'cyan');
    log(`⚠️ Conflitos encontrados: ${report.conflicts.length}`, 'yellow');
    log(`🔄 Duplicatas encontradas: ${report.duplicates.length}`, 'yellow');
    log(`👻 Órfãs encontradas: ${report.orphans.length}`, 'cyan');
    
    // 5. Recomendações
    log('\n💡 RECOMENDAÇÕES', 'magenta');
    log('===============\n', 'magenta');
    
    if (files.length > 10) {
      log('📦 Muitos arquivos de migração espalhados - reorganizar necessário', 'yellow');
    }
    
    if (report.duplicates.length > 0) {
      log('🗑️ Remover arquivos duplicados encontrados', 'yellow');
    }
    
    if (report.conflicts.length > 0) {
      log('💥 Resolver conflitos de criação de tabelas', 'red');
    }
    
    if (executedMigrations.length === 0) {
      log('🔧 Implementar sistema de controle de migrações', 'cyan');
    }
    
    log('\n🔧 Próximo passo: node scripts/organize-migrations.js', 'green');
    
    await client.end();
    
  } catch (error) {
    log(`❌ Erro durante análise: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, analyzeMigrationFiles, checkExecutedMigrations };