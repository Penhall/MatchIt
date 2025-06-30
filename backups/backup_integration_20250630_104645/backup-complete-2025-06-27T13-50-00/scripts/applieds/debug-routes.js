// scripts/debug-routes.js - Diagnóstico de Rotas
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DE ROTAS - MATCHIT');
console.log('================================\n');

// Verificar estrutura de arquivos
const checkFile = (filePath, description) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${description}: ${filePath} (${stats.size} bytes)`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - NÃO ENCONTRADO`);
    return false;
  }
};

// Verificar arquivos essenciais
console.log('📁 VERIFICANDO ARQUIVOS ESSENCIAIS:\n');

const files = [
  ['server/app.js', 'Servidor principal'],
  ['server/routes/auth.js', 'Rotas de autenticação'],
  ['server/routes/profile.js', 'Rotas de perfil'],
  ['server/middleware/auth.js', 'Middleware de autenticação'],
  ['server/config/database.js', 'Configuração do banco'],
  ['.env', 'Variáveis de ambiente'],
  ['package.json', 'Configuração do projeto']
];

const existingFiles = [];
files.forEach(([path, desc]) => {
  if (checkFile(path, desc)) {
    existingFiles.push(path);
  }
});

console.log(`\n📊 Total: ${existingFiles.length}/${files.length} arquivos encontrados\n`);

// Testar imports dos arquivos de rota
console.log('🔧 TESTANDO IMPORTS DOS ARQUIVOS DE ROTA:\n');

const testRouteFile = (filePath, routeName) => {
  try {
    console.log(`🔍 Testando: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ Arquivo não existe\n`);
      return false;
    }
    
    // Ler conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se exporta module.exports
    if (content.includes('module.exports')) {
      console.log(`   ✅ Encontrado module.exports`);
    } else {
      console.log(`   ❌ module.exports não encontrado`);
    }
    
    // Verificar se cria router
    if (content.includes('express.Router()')) {
      console.log(`   ✅ Cria express.Router()`);
    } else {
      console.log(`   ❌ express.Router() não encontrado`);
    }
    
    // Tentar fazer require
    delete require.cache[require.resolve(path.resolve(filePath))];
    const module = require(path.resolve(filePath));
    
    if (typeof module === 'function') {
      console.log(`   ✅ Exporta função (router válido)`);
      console.log(`   ✅ ${routeName} - FUNCIONANDO\n`);
      return true;
    } else {
      console.log(`   ❌ Não exporta função válida (tipo: ${typeof module})`);
      console.log(`   ❌ ${routeName} - PROBLEMA NA EXPORTAÇÃO\n`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao importar: ${error.message}`);
    console.log(`   ❌ ${routeName} - ERRO DE IMPORT\n`);
    return false;
  }
};

// Testar cada arquivo de rota
const routeTests = [
  ['server/routes/auth.js', 'Rotas de Autenticação'],
  ['server/routes/profile.js', 'Rotas de Perfil']
];

let workingRoutes = 0;
routeTests.forEach(([path, name]) => {
  if (testRouteFile(path, name)) {
    workingRoutes++;
  }
});

// Relatório final
console.log('📋 RELATÓRIO FINAL:\n');
console.log(`📁 Arquivos encontrados: ${existingFiles.length}/${files.length}`);
console.log(`🔧 Rotas funcionando: ${workingRoutes}/${routeTests.length}`);

if (workingRoutes === routeTests.length) {
  console.log('\n✅ TODOS OS ARQUIVOS DE ROTA ESTÃO FUNCIONANDO!');
  console.log('🚀 Tente iniciar o servidor novamente: npm run server\n');
} else {
  console.log('\n❌ PROBLEMAS ENCONTRADOS NOS ARQUIVOS DE ROTA');
  console.log('💡 Soluções sugeridas:');
  console.log('   1. Verifique se todos os arquivos foram criados corretamente');
  console.log('   2. Certifique-se de que cada arquivo termina com: module.exports = router;');
  console.log('   3. Verifique se não há erros de sintaxe nos arquivos');
  console.log('   4. Use os artifacts fornecidos para recriar os arquivos problemáticos\n');
}

// Próximos passos
console.log('🎯 PRÓXIMOS PASSOS:');
console.log('   1. Corrija os arquivos problemáticos');
console.log('   2. Execute novamente: node scripts/debug-routes.js');
console.log('   3. Quando tudo estiver ✅, execute: npm run server');
console.log('   4. Teste com: ./scripts/test-phase0.sh\n');