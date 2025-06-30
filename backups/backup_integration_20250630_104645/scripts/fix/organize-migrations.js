// scripts/organize-migrations.js - Organizador de Migrações MatchIt
require('dotenv').config();
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

// Estrutura padrão de migrações
const MIGRATION_STRUCTURE = {
  'migrations': {
    'core': 'Migrações essenciais do sistema',
    'features': 'Migrações de funcionalidades',
    'data': 'Seeds e dados iniciais',
    'indexes': 'Criação de índices',
    'cleanup': 'Limpeza e otimizações'
  },
  'archive': {
    'old': 'Migrações antigas/obsoletas',
    'duplicates': 'Arquivos duplicados',
    'broken': 'Migrações com problemas'
  }
};

// Classificação de migrações por prioridade
const MIGRATION_PRIORITIES = {
  'critical': ['users', 'schema_migrations', 'sessions'],
  'high': ['user_profiles', 'style_choices', 'matches'],
  'medium': ['emotional_profiles', 'recommendations', 'analytics'],
  'low': ['logs', 'temp_', 'test_', 'seed_']
};

// Criar estrutura de diretórios
const createDirectoryStructure = () => {
  log('📁 CRIANDO ESTRUTURA ORGANIZADA', 'magenta');
  log('===============================\n', 'magenta');
  
  const basePath = 'database';
  
  // Criar estrutura principal
  Object.keys(MIGRATION_STRUCTURE).forEach(category => {
    const categoryPath = path.join(basePath, category);
    
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
      log(`✅ Criado: ${categoryPath}`, 'green');
    }
    
    Object.keys(MIGRATION_STRUCTURE[category]).forEach(subCategory => {
      const subPath = path.join(categoryPath, subCategory);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
        log(`✅ Criado: ${subPath}`, 'green');
      }
    });
  });
  
  // Criar README para cada diretório
  Object.keys(MIGRATION_STRUCTURE).forEach(category => {
    Object.keys(MIGRATION_STRUCTURE[category]).forEach(subCategory => {
      const readmePath = path.join(basePath, category, subCategory, 'README.md');
      const description = MIGRATION_STRUCTURE[category][subCategory];
      
      if (!fs.existsSync(readmePath)) {
        const readmeContent = `# ${subCategory.charAt(0).toUpperCase() + subCategory.slice(1)}\n\n${description}\n\n## Arquivos neste diretório\n\n<!-- Esta seção será atualizada automaticamente -->\n`;
        fs.writeFileSync(readmePath, readmeContent);
        log(`📝 README criado: ${readmePath}`, 'cyan');
      }
    });
  });
  
  log('');
};

// Analisar e classificar arquivo de migração
const classifyMigration = (filePath, content) => {
  const filename = path.basename(filePath);
  const filenameLower = filename.toLowerCase();
  
  // Detectar tipo baseado no conteúdo
  let category = 'features';
  let subCategory = 'features';
  let priority = 'medium';
  let newName = filename;
  
  // Classificar por prioridade
  for (const [priorityLevel, keywords] of Object.entries(MIGRATION_PRIORITIES)) {
    if (keywords.some(keyword => filenameLower.includes(keyword) || content.toLowerCase().includes(keyword))) {
      priority = priorityLevel;
      break;
    }
  }
  
  // Detectar categoria principal
  if (content.includes('CREATE TABLE users') || filenameLower.includes('user')) {
    category = 'migrations';
    subCategory = 'core';
  } else if (content.includes('INSERT INTO') && (content.includes('seed') || filenameLower.includes('seed'))) {
    category = 'migrations';
    subCategory = 'data';
  } else if (content.includes('CREATE INDEX') || filenameLower.includes('index')) {
    category = 'migrations';
    subCategory = 'indexes';
  } else if (filenameLower.includes('cleanup') || filenameLower.includes('fix') || filenameLower.includes('drop')) {
    category = 'migrations';
    subCategory = 'cleanup';
  } else if (filenameLower.includes('emotional')) {
    category = 'migrations';
    subCategory = 'features';
  }
  
  // Detectar arquivos problemáticos
  if (filenameLower.includes('backup') || filenameLower.includes('old') || filenameLower.includes('temp')) {
    category = 'archive';
    subCategory = 'old';
  }
  
  // Gerar nome padronizado
  if (!filename.match(/^\d{3}_/)) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    newName = `${timestamp}_${sanitizedName}`;
  }
  
  return {
    category,
    subCategory,
    priority,
    newName,
    analysis: {
      hasCreateTable: content.includes('CREATE TABLE'),
      hasAlterTable: content.includes('ALTER TABLE'),
      hasDropTable: content.includes('DROP TABLE'),
      hasInsert: content.includes('INSERT'),
      hasIndex: content.includes('CREATE INDEX'),
      hasFunction: content.includes('CREATE FUNCTION'),
      lineCount: content.split('\n').length
    }
  };
};

// Detectar arquivos duplicados
const findDuplicates = (files) => {
  log('🔍 DETECTANDO DUPLICATAS', 'cyan');
  log('========================\n', 'cyan');
  
  const duplicates = [];
  const checksums = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const normalizedContent = content.replace(/\s+/g, ' ').trim();
    const checksum = crypto.createHash('md5').update(normalizedContent).digest('hex');
    
    if (checksums[checksum]) {
      duplicates.push({
        original: checksums[checksum],
        duplicate: file,
        checksum
      });
      log(`🔄 Duplicata encontrada:`, 'yellow');
      log(`   Original: ${checksums[checksum]}`, 'white');
      log(`   Duplicata: ${file}`, 'white');
    } else {
      checksums[checksum] = file;
    }
  });
  
  log(`\n📊 Total de duplicatas: ${duplicates.length}\n`, 'cyan');
  return duplicates;
};

// Mover arquivos para nova estrutura
const organizeFiles = (files, duplicates, dryRun = false) => {
  log('📦 ORGANIZANDO ARQUIVOS', 'magenta');
  log('======================\n', 'magenta');
  
  const moves = [];
  const duplicateFiles = duplicates.map(d => d.duplicate);
  
  files.forEach(filePath => {
    // Pular duplicatas
    if (duplicateFiles.includes(filePath)) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const classification = classifyMigration(filePath, content);
    
    const newPath = path.join(
      'database',
      classification.category,
      classification.subCategory,
      classification.newName
    );
    
    moves.push({
      from: filePath,
      to: newPath,
      classification
    });
    
    if (dryRun) {
      log(`📄 ${filePath}`, 'white');
      log(`   → ${newPath}`, 'cyan');
      log(`   Categoria: ${classification.category}/${classification.subCategory}`, 'white');
      log(`   Prioridade: ${classification.priority}`, 'white');
      log('');
    } else {
      // Criar diretório se não existir
      const targetDir = path.dirname(newPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Mover arquivo
      fs.copyFileSync(filePath, newPath);
      log(`✅ Movido: ${path.basename(filePath)} → ${newPath}`, 'green');
    }
  });
  
  return moves;
};

// Criar arquivo de controle de migrações
const createMigrationControl = (moves) => {
  log('\n📋 CRIANDO CONTROLE DE MIGRAÇÕES', 'magenta');
  log('=================================\n', 'magenta');
  
  const controlFile = 'database/migration-manifest.json';
  const migrationData = {
    generated_at: new Date().toISOString(),
    total_migrations: moves.length,
    structure: MIGRATION_STRUCTURE,
    migrations: moves.map(move => ({
      id: crypto.createHash('md5').update(move.from).digest('hex').substring(0, 8),
      original_path: move.from,
      new_path: move.to,
      category: move.classification.category,
      subcategory: move.classification.subCategory,
      priority: move.classification.priority,
      analysis: move.classification.analysis,
      organized_at: new Date().toISOString()
    }))
  };
  
  fs.writeFileSync(controlFile, JSON.stringify(migrationData, null, 2));
  log(`✅ Manifesto criado: ${controlFile}`, 'green');
  
  // Criar arquivo de migração SQL para controle
  const migrationControlSQL = `-- Migration Control System for MatchIt
-- Generated at: ${new Date().toISOString()}

-- Create migration control table if not exists
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64),
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(20)
);

-- Create migration log table
CREATE TABLE IF NOT EXISTS migration_logs (
  id SERIAL PRIMARY KEY,
  migration_version VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'up', 'down', 'failed'
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER,
  error_message TEXT
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_migration_logs_version ON migration_logs(migration_version);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at);

-- Insert organized migrations into control table
${moves.map(move => {
  const version = path.basename(move.to, '.sql');
  const checksum = crypto.createHash('md5').update(fs.readFileSync(move.from, 'utf8')).digest('hex');
  return `INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('${version}', '${path.basename(move.to)}', '${checksum}', '${move.classification.category}', '${move.classification.priority}') 
ON CONFLICT (version) DO NOTHING;`;
}).join('\n')}
`;
  
  const controlSQLFile = 'database/migrations/core/000_migration_control_system.sql';
  fs.writeFileSync(controlSQLFile, migrationControlSQL);
  log(`✅ Sistema de controle SQL criado: ${controlSQLFile}`, 'green');
  
  return migrationData;
};

// Gerar script de limpeza
const generateCleanupScript = (duplicates, obsoleteFiles) => {
  log('\n🗑️ GERANDO SCRIPT DE LIMPEZA', 'magenta');
  log('=============================\n', 'magenta');
  
  const cleanupScript = `#!/bin/bash
# Cleanup script for MatchIt migrations
# Generated at: ${new Date().toISOString()}

set -e

echo "🗑️ Limpeza de Arquivos de Migração MatchIt"
echo "=========================================="

# Backup antes da limpeza
BACKUP_DIR="backup_migrations_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Criando backup em: $BACKUP_DIR"

# Arquivos duplicados
echo "🔄 Removendo duplicatas..."
${duplicates.map(dup => `cp "${dup.duplicate}" "$BACKUP_DIR/"
rm "${dup.duplicate}"
echo "   ❌ Removido: ${dup.duplicate}"`).join('\n')}

# Arquivos obsoletos
echo "👻 Removendo arquivos obsoletos..."
${obsoleteFiles.map(file => `cp "${file}" "$BACKUP_DIR/"
rm "${file}"
echo "   ❌ Removido: ${file}"`).join('\n')}

echo "✅ Limpeza concluída!"
echo "📦 Backup disponível em: $BACKUP_DIR"
echo ""
echo "Para restaurar arquivos se necessário:"
echo "  cp $BACKUP_DIR/* [pasta_destino]/"
`;

  const cleanupFile = 'scripts/cleanup-migrations.sh';
  fs.writeFileSync(cleanupFile, cleanupScript);
  fs.chmodSync(cleanupFile, '755');
  
  log(`✅ Script de limpeza criado: ${cleanupFile}`, 'green');
  log(`   Execute com: bash ${cleanupFile}`, 'cyan');
  
  return cleanupFile;
};

// Função principal
const main = async () => {
  log('🗂️ ORGANIZADOR DE MIGRAÇÕES - MATCHIT', 'magenta');
  log('====================================\n', 'magenta');
  
  try {
    // 1. Encontrar todos os arquivos de migração
    const migrationPaths = ['database/migrations', 'scripts/migrations', 'scripts', 'server/migrations'];
    const files = [];
    
    migrationPaths.forEach(dir => {
      if (fs.existsSync(dir)) {
        const dirFiles = fs.readdirSync(dir, { recursive: true })
          .filter(file => file.endsWith('.sql') || (file.endsWith('.js') && file.includes('migrat')))
          .map(file => path.join(dir, file));
        files.push(...dirFiles);
      }
    });
    
    log(`📁 ${files.length} arquivos de migração encontrados\n`, 'cyan');
    
    // 2. Criar estrutura organizada
    createDirectoryStructure();
    
    // 3. Detectar duplicatas
    const duplicates = findDuplicates(files);
    
    // 4. Organizar arquivos (modo dry-run primeiro)
    log('🔍 SIMULAÇÃO (DRY RUN)', 'yellow');
    log('=====================\n', 'yellow');
    const moves = organizeFiles(files, duplicates, true);
    
    // 5. Confirmar ação
    console.log('\n');
    import readline from 'readline';.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('🤔 Proceder com a organização? (y/N): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
      log('❌ Operação cancelada pelo usuário', 'yellow');
      return;
    }
    
    // 6. Executar organização
    log('\n📦 EXECUTANDO ORGANIZAÇÃO', 'green');
    log('=========================\n', 'green');
    organizeFiles(files, duplicates, false);
    
    // 7. Criar sistema de controle
    const migrationData = createMigrationControl(moves);
    
    // 8. Gerar scripts de limpeza
    const obsoleteFiles = []; // Arquivos que devem ser removidos
    const cleanupScript = generateCleanupScript(duplicates, obsoleteFiles);
    
    // 9. Relatório final
    log('\n📊 RELATÓRIO FINAL', 'magenta');
    log('================\n', 'magenta');
    
    log(`✅ ${moves.length} arquivos organizados`, 'green');
    log(`🔄 ${duplicates.length} duplicatas identificadas`, 'yellow');
    log(`📋 Manifesto criado com ${migrationData.migrations.length} migrações`, 'cyan');
    log(`🗑️ Script de limpeza: ${cleanupScript}`, 'cyan');
    
    log('\n🎯 PRÓXIMOS PASSOS:', 'magenta');
    log('1. Execute: bash scripts/cleanup-migrations.sh', 'white');
    log('2. Execute: node scripts/run-migrations.js', 'white');
    log('3. Verifique: database/migration-manifest.json', 'white');
    
  } catch (error) {
    log(`❌ Erro durante organização: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export default { main, classifyMigration, createDirectoryStructure };