// fix-package.js - Correção rápida do package.json para adicionar script "server"
const fs = require('fs');

console.log('🔧 CORRIGINDO PACKAGE.JSON - ADICIONANDO SCRIPT SERVER');
console.log('====================================================');

try {
    // Ler package.json atual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Criar backup
    const backupName = `package.json.backup.${Date.now()}`;
    fs.writeFileSync(backupName, JSON.stringify(packageJson, null, 2));
    console.log(`📁 Backup criado: ${backupName}`);
    
    // Verificar se existe a seção scripts
    if (!packageJson.scripts) {
        packageJson.scripts = {};
    }
    
    // Scripts essenciais para Windows/Linux
    const essentialScripts = {
        "server": "node server/app.js",
        "start": "node server/app.js", 
        "dev": "nodemon server/app.js",
        "health": "node -e \"require('http').get('http://localhost:3000/api/health', (res) => { res.on('data', (data) => console.log(data.toString())); }).on('error', () => console.log('Servidor não está rodando'));\""
    };
    
    // Adicionar/atualizar scripts
    Object.assign(packageJson.scripts, essentialScripts);
    
    // Salvar package.json corrigido
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('✅ package.json corrigido com sucesso!');
    console.log('');
    console.log('📋 Scripts adicionados:');
    Object.keys(essentialScripts).forEach(script => {
        console.log(`   npm run ${script}`);
    });
    
    console.log('');
    console.log('🚀 AGORA VOCÊ PODE USAR:');
    console.log('   npm run server   ← PRINCIPAL');
    console.log('   npm run dev      ← COM NODEMON');
    console.log('   npm run health   ← TESTAR SAÚDE');
    console.log('');
    
    // Verificar se server/app.js existe
    if (fs.existsSync('server/app.js')) {
        console.log('✅ server/app.js encontrado - pronto para iniciar!');
    } else {
        console.log('⚠️  server/app.js não encontrado - verifique a estrutura');
    }
    
} catch (error) {
    console.error('❌ Erro ao corrigir package.json:', error.message);
    console.log('');
    console.log('📋 SOLUÇÃO MANUAL:');
    console.log('1. Abra o arquivo package.json');
    console.log('2. Encontre a seção "scripts" (ou crie se não existir)');
    console.log('3. Adicione: "server": "node server/app.js"');
    console.log('4. Salve o arquivo');
    console.log('5. Execute: npm run server');
    process.exit(1);
}