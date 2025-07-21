#!/usr/bin/env node

// Script de validação das configurações Docker do MatchIt
const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDAÇÃO DAS CONFIGURAÇÕES DOCKER - MATCHIT\n');

const infraDir = __dirname;
const projectRoot = path.dirname(infraDir);

// Resultados da validação
const results = {
  files: [],
  errors: [],
  warnings: [],
  suggestions: []
};

// 1. Verificar arquivos essenciais
console.log('📁 Verificando arquivos essenciais...');

const essentialFiles = [
  'docker-compose.yml',
  'Dockerfile.backend', 
  'Dockerfile.frontend',
  'nginx.conf'
];

essentialFiles.forEach(file => {
  const filePath = path.join(infraDir, file);
  if (fs.existsSync(filePath)) {
    results.files.push(`✅ ${file} - encontrado`);
  } else {
    results.errors.push(`❌ ${file} - FALTANDO`);
  }
});

// 2. Verificar sintaxe dos Dockerfiles
console.log('\n📝 Verificando Dockerfiles...');

const dockerfiles = ['Dockerfile.backend', 'Dockerfile.frontend'];
dockerfiles.forEach(dockerfile => {
  const filePath = path.join(infraDir, dockerfile);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificações básicas
    if (!content.includes('FROM ')) {
      results.errors.push(`❌ ${dockerfile} - Instrução FROM faltando`);
    }
    
    if (content.includes('WORKDIR ')) {
      results.files.push(`✅ ${dockerfile} - WORKDIR definido`);
    } else {
      results.warnings.push(`⚠️  ${dockerfile} - WORKDIR não definido`);
    }
    
    if (content.includes('EXPOSE ')) {
      results.files.push(`✅ ${dockerfile} - EXPOSE definido`);
    } else {
      results.warnings.push(`⚠️  ${dockerfile} - EXPOSE não definido`);
    }

    // Verificar multi-stage builds
    const fromCount = (content.match(/FROM /g) || []).length;
    if (fromCount > 1) {
      results.files.push(`✅ ${dockerfile} - Multi-stage build`);
    }
  }
});

// 3. Verificar estrutura do docker-compose
console.log('\n🐳 Verificando docker-compose...');

const composeFile = path.join(infraDir, 'docker-compose.yml');
if (fs.existsSync(composeFile)) {
  const content = fs.readFileSync(composeFile, 'utf8');
  
  // Verificar serviços essenciais
  const requiredServices = ['postgres', 'backend'];
  requiredServices.forEach(service => {
    if (content.includes(`${service}:`)) {
      results.files.push(`✅ Serviço ${service} definido`);
    } else {
      results.errors.push(`❌ Serviço ${service} FALTANDO`);
    }
  });
  
  // Verificar healthchecks
  if (content.includes('healthcheck:')) {
    results.files.push(`✅ Healthchecks configurados`);
  } else {
    results.suggestions.push(`💡 Adicionar healthchecks para monitoramento`);
  }
  
  // Verificar networks
  if (content.includes('networks:')) {
    results.files.push(`✅ Networks personalizadas definidas`);
  } else {
    results.warnings.push(`⚠️  Networks personalizadas não definidas`);
  }
  
  // Verificar volumes
  if (content.includes('volumes:')) {
    results.files.push(`✅ Volumes persistentes configurados`);
  } else {
    results.warnings.push(`⚠️  Volumes persistentes não configurados`);
  }
}

// 4. Verificar nginx.conf
console.log('\n🌐 Verificando configuração Nginx...');

const nginxFile = path.join(infraDir, 'nginx.conf');
if (fs.existsSync(nginxFile)) {
  const content = fs.readFileSync(nginxFile, 'utf8');
  
  if (content.includes('upstream ')) {
    results.files.push(`✅ Upstream backend configurado`);
  } else {
    results.warnings.push(`⚠️  Upstream backend não configurado`);
  }
  
  if (content.includes('location /api')) {
    results.files.push(`✅ Proxy para API configurado`);
  } else {
    results.errors.push(`❌ Proxy para API FALTANDO`);
  }
  
  if (content.includes('gzip on')) {
    results.files.push(`✅ Compressão gzip habilitada`);
  } else {
    results.suggestions.push(`💡 Habilitar compressão gzip para performance`);
  }
  
  if (content.includes('limit_req_zone')) {
    results.files.push(`✅ Rate limiting configurado`);
  } else {
    results.suggestions.push(`💡 Configurar rate limiting para segurança`);
  }
}

// 5. Verificar estrutura de diretórios necessários
console.log('\n📂 Verificando estrutura de diretórios...');

const requiredDirs = ['logs', 'uploads'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(projectRoot, dir);
  if (fs.existsSync(dirPath)) {
    results.files.push(`✅ Diretório ${dir}/ existe`);
  } else {
    results.warnings.push(`⚠️  Diretório ${dir}/ não existe (será criado pelo Docker)`);
  }
});

// 6. Verificar problemas conhecidos na estrutura atual
console.log('\n⚠️  Verificando problemas conhecidos...');

// Problema 1: Caminhos incorretos nos Dockerfiles
const backendDockerfile = path.join(infraDir, 'Dockerfile.backend');
if (fs.existsSync(backendDockerfile)) {
  const content = fs.readFileSync(backendDockerfile, 'utf8');
  
  if (content.includes('packages/backend/')) {
    results.errors.push(`❌ Dockerfile.backend referencia 'packages/backend/' que não existe`);
    results.suggestions.push(`💡 Corrigir caminhos para a estrutura atual do projeto`);
  }
  
  if (content.includes('/app/backend/backend')) {
    results.warnings.push(`⚠️  WORKDIR duplicado '/app/backend/backend' pode causar confusão`);
  }
}

// Problema 2: docker-compose referenciando arquivos inexistentes
const composeContent = fs.readFileSync(composeFile, 'utf8');
if (composeContent.includes('./scripts/Banco de dados/')) {
  const scriptsPath = path.join(projectRoot, 'scripts', 'Banco de dados');
  if (!fs.existsSync(scriptsPath)) {
    results.errors.push(`❌ docker-compose referencia './scripts/Banco de dados/' que não existe`);
  }
}

// Problema 3: Múltiplos arquivos docker-compose
const composeFiles = ['docker-compose.yml', 'docker-compose1', 'docker-compose2'];
const existingComposeFiles = composeFiles.filter(f => fs.existsSync(path.join(infraDir, f)));
if (existingComposeFiles.length > 1) {
  results.warnings.push(`⚠️  Múltiplos arquivos docker-compose encontrados: ${existingComposeFiles.join(', ')}`);
  results.suggestions.push(`💡 Consolidar em um único docker-compose.yml`);
}

// RELATÓRIO FINAL
console.log('\n' + '='.repeat(60));
console.log('📊 RELATÓRIO FINAL DA VALIDAÇÃO');
console.log('='.repeat(60));

console.log(`\n✅ SUCESSOS (${results.files.length}):`);
results.files.forEach(item => console.log(`   ${item}`));

if (results.errors.length > 0) {
  console.log(`\n❌ ERROS CRÍTICOS (${results.errors.length}):`);
  results.errors.forEach(item => console.log(`   ${item}`));
}

if (results.warnings.length > 0) {
  console.log(`\n⚠️  AVISOS (${results.warnings.length}):`);
  results.warnings.forEach(item => console.log(`   ${item}`));
}

if (results.suggestions.length > 0) {
  console.log(`\n💡 SUGESTÕES DE MELHORIA (${results.suggestions.length}):`);
  results.suggestions.forEach(item => console.log(`   ${item}`));
}

// SCORE FINAL
const totalChecks = results.files.length + results.errors.length + results.warnings.length;
const successRate = Math.round((results.files.length / totalChecks) * 100);

console.log('\n' + '='.repeat(60));
console.log(`🎯 SCORE FINAL: ${successRate}% (${results.files.length}/${totalChecks} verificações passaram)`);

if (results.errors.length === 0) {
  console.log('🎉 CONFIGURAÇÃO DOCKER FUNCIONAL - Pronta para uso!');
} else {
  console.log('🔧 CORREÇÕES NECESSÁRIAS antes do deployment');
}

console.log('='.repeat(60));

// Exit code baseado no resultado
process.exit(results.errors.length > 0 ? 1 : 0);