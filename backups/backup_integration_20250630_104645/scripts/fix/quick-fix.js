// quick-fix.js - Correção rápida para Windows MatchIt
import fs from 'fs';

console.log('🚀 CORREÇÃO RÁPIDA WINDOWS - MATCHIT\n');

try {
    // Ler package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Backup
    fs.writeFileSync(`package.json.backup.${Date.now()}`, JSON.stringify(packageJson, null, 2));
    console.log('📁 Backup do package.json criado');
    
    // Scripts essenciais para Windows
    const essentialScripts = {
        "server": "node server/app.js",
        "dev": "nodemon server/app.js", 
        "start": "node server/app.js",
        "test": "jest",
        "health": "curl -s http://localhost:3000/api/health || echo 'Servidor nao esta rodando'"
    };
    
    // Atualizar apenas os scripts essenciais
    packageJson.scripts = { ...packageJson.scripts, ...essentialScripts };
    
    // Salvar
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('✅ package.json corrigido!\n');
    console.log('📋 Scripts adicionados:');
    Object.keys(essentialScripts).forEach(script => {
        console.log(`   npm run ${script}`);
    });
    
    console.log('\n🎯 SOLUÇÃO IMEDIATA:');
    console.log('   npm run server   <- USE ESTE COMANDO!');
    console.log('\n💡 Este comando funciona no Windows sem NODE_ENV');
    
} catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 SOLUÇÃO MANUAL:');
    console.log('1. Abra package.json');
    console.log('2. Na seção "scripts", adicione:');
    console.log('   "server": "node server/app.js"');
    console.log('3. Salve o arquivo');
    console.log('4. Execute: npm run server');
}