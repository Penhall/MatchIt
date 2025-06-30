// scripts/force-port-3000.js - Força o backend a rodar na porta 3000

const fs = require('fs');
const path = require('path');

console.log('🔧 FORÇANDO BACKEND PARA PORTA 3000');
console.log('===================================\n');

// 1. Verificar e corrigir server/app.js
function fixServerApp() {
    console.log('🔍 Verificando server/app.js...');
    
    const serverPath = path.join(process.cwd(), 'server', 'app.js');
    
    if (!fs.existsSync(serverPath)) {
        console.log('❌ server/app.js não encontrado');
        return false;
    }
    
    let content = fs.readFileSync(serverPath, 'utf8');
    
    // Backup
    const backupPath = serverPath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, content);
    console.log(`📁 Backup criado: ${path.basename(backupPath)}`);
    
    // Procurar pela linha de definição da porta
    const originalContent = content;
    
    // Substitituir diferentes padrões de configuração de porta
    content = content.replace(/const PORT = process\.env\.PORT \|\| \d+/g, 'const PORT = process.env.PORT || 3000');
    content = content.replace(/const port = process\.env\.PORT \|\| \d+/g, 'const port = process.env.PORT || 3000');
    content = content.replace(/app\.listen\(\d+/g, 'app.listen(3000');
    content = content.replace(/app\.listen\(port\)/g, 'app.listen(PORT || 3000)');
    content = content.replace(/server\.listen\(\d+/g, 'server.listen(3000');
    
    // Garantir que a variável PORT seja definida corretamente
    if (!content.includes('const PORT = process.env.PORT || 3000') && !content.includes('const port = process.env.PORT || 3000')) {
        // Adicionar definição de PORT se não existir
        const insertPoint = content.indexOf('app.listen') || content.indexOf('server.listen');
        if (insertPoint > -1) {
            const beforeListen = content.substring(0, insertPoint);
            const afterListen = content.substring(insertPoint);
            content = beforeListen + '\n// Força porta 3000\nconst PORT = process.env.PORT || 3000;\n\n' + afterListen.replace(/app\.listen\([^,)]+/, 'app.listen(PORT');
        }
    }
    
    // Verificar se houve mudanças
    if (content !== originalContent) {
        fs.writeFileSync(serverPath, content);
        console.log('✅ server/app.js corrigido para porta 3000');
        return true;
    } else {
        console.log('ℹ️  server/app.js já está configurado corretamente');
        return true;
    }
}

// 2. Corrigir .env
function fixEnvFile() {
    console.log('\n🔍 Verificando arquivo .env...');
    
    const envPath = path.join(process.cwd(), '.env');
    
    // Criar/atualizar .env
    const envContent = `# Configuração forçada - porta 3000
NODE_ENV=development
PORT=3000

# URLs corretas
API_BASE_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# JWT
JWT_SECRET=matchit_secret_key_development_2024
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000

# Logs
LOG_LEVEL=debug
`;

    // Backup se existir
    if (fs.existsSync(envPath)) {
        const backupPath = envPath + '.backup.' + Date.now();
        fs.copyFileSync(envPath, backupPath);
        console.log(`📁 Backup do .env: ${path.basename(backupPath)}`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env configurado para porta 3000');
}

// 3. Corrigir package.json
function fixPackageJson() {
    console.log('\n🔍 Verificando package.json...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packagePath)) {
        console.log('❌ package.json não encontrado');
        return false;
    }
    
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Backup
    const backupPath = packagePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, JSON.stringify(pkg, null, 2));
    console.log(`📁 Backup do package.json: ${path.basename(backupPath)}`);
    
    // Corrigir scripts
    pkg.scripts = pkg.scripts || {};
    
    // Scripts que forçam porta 3000
    const forcedScripts = {
        'server': 'cross-env PORT=3000 node server/app.js',
        'backend': 'cross-env PORT=3000 node server/app.js',
        'start:server': 'cross-env PORT=3000 node server/app.js',
        'dev': 'vite',
        'frontend': 'vite',
        'start:frontend': 'vite',
        'health': 'node -e "require(\\"http\\").get(\\"http://localhost:3000/api/health\\", r => r.on(\\"data\\", d => console.log(d.toString())))"',
        'test:port': 'node -e "require(\\"http\\").get(\\"http://localhost:3000/api/health\\", r => console.log(\\"✅ Porta 3000 OK\\")).on(\\"error\\", () => console.log(\\"❌ Porta 3000 não responde\\"))"'
    };
    
    Object.assign(pkg.scripts, forcedScripts);
    
    // Garantir cross-env
    pkg.devDependencies = pkg.devDependencies || {};
    if (!pkg.devDependencies['cross-env']) {
        pkg.devDependencies['cross-env'] = '^7.0.3';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('✅ package.json configurado para forçar porta 3000');
}

// 4. Criar script de inicialização simples
function createStartScript() {
    console.log('\n🔍 Criando script de inicialização...');
    
    const startScript = `#!/bin/bash
# start-port-3000.sh - Força backend na porta 3000

echo "🚀 Iniciando MatchIt - Backend FORÇADO para porta 3000"
echo "====================================================="

# Matar processos Node existentes (Windows compatible)
echo "🔧 Parando processos Node.js..."
if command -v taskkill >/dev/null 2>&1; then
    taskkill /F /IM node.exe 2>/dev/null || echo "Nenhum processo Node encontrado"
else
    pkill -f node 2>/dev/null || echo "Nenhum processo Node encontrado"
fi

echo ""
echo "🔧 Iniciando backend na porta 3000..."
echo "   Comando: cross-env PORT=3000 node server/app.js"
echo ""

# Força a porta 3000 via variável de ambiente
export PORT=3000
npm run server

echo ""
echo "❌ Backend parado"
`;

    fs.writeFileSync('start-port-3000.sh', startScript);
    
    // Para Windows, criar também .bat
    const batScript = `@echo off
echo 🚀 Iniciando MatchIt - Backend FORÇADO para porta 3000
echo =====================================================

echo 🔧 Parando processos Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 🔧 Iniciando backend na porta 3000...
echo    Comando: cross-env PORT=3000 node server/app.js
echo.

set PORT=3000
npm run server

echo.
echo ❌ Backend parado
pause
`;

    fs.writeFileSync('start-port-3000.bat', batScript);
    
    console.log('✅ Scripts de inicialização criados:');
    console.log('   - start-port-3000.sh (Linux/Mac)');
    console.log('   - start-port-3000.bat (Windows)');
}

// 5. Criar teste de conectividade
function createTest() {
    console.log('\n🔍 Criando teste de porta...');
    
    const testScript = `// test-port-3000.js - Teste específico da porta 3000
const http = require('http');

console.log('🧪 TESTE DE CONECTIVIDADE - PORTA 3000');
console.log('=====================================\\n');

const testPort3000 = () => {
    return new Promise((resolve) => {
        console.log('🔍 Testando http://localhost:3000/api/health...');
        
        const req = http.get('http://localhost:3000/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('✅ SUCESSO! Backend respondeu na porta 3000');
                    console.log('📄 Resposta:', parsed.message || 'OK');
                    console.log('🕐 Timestamp:', parsed.timestamp || 'N/A');
                    resolve(true);
                } catch (e) {
                    console.log('⚠️  Backend responde na porta 3000, mas resposta não é JSON válido');
                    console.log('📄 Resposta recebida:', data.substring(0, 200));
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log('❌ ERRO: Backend NÃO responde na porta 3000');
            console.log('🔧 Motivo:', err.message);
            if (err.code === 'ECONNREFUSED') {
                console.log('');
                console.log('💡 SOLUÇÕES:');
                console.log('   1. Execute: npm run server');
                console.log('   2. Ou use: start-port-3000.bat (Windows)');
                console.log('   3. Ou use: ./start-port-3000.sh (Linux/Mac)');
                console.log('   4. Verifique se não há erro no servidor');
            }
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ TIMEOUT: Backend não respondeu em 5 segundos');
            req.destroy();
            resolve(false);
        });
    });
};

const testPort3001 = () => {
    return new Promise((resolve) => {
        console.log('🔍 Verificando se porta 3001 ainda está ativa...');
        
        const req = http.get('http://localhost:3001/api/health', (res) => {
            console.log('⚠️  ATENÇÃO: Backend ainda está rodando na porta 3001!');
            console.log('🔧 Pare o processo e reinicie com o script correto');
            resolve(true);
        });
        
        req.on('error', () => {
            console.log('✅ Porta 3001 livre (correto)');
            resolve(false);
        });
        
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
};

(async () => {
    const port3000Ok = await testPort3000();
    const port3001Active = await testPort3001();
    
    console.log('\\n📋 RESUMO:');
    console.log('=========');
    
    if (port3000Ok) {
        console.log('✅ Backend funcionando corretamente na porta 3000');
        console.log('✅ Configuração PERFEITA!');
        console.log('\\n🌐 URLs disponíveis:');
        console.log('   Backend: http://localhost:3000');
        console.log('   API Health: http://localhost:3000/api/health');
        console.log('   Frontend: http://localhost:5173 (inicie com npm run dev)');
    } else {
        console.log('❌ Backend NÃO está funcionando na porta 3000');
        console.log('\\n🔧 AÇÕES NECESSÁRIAS:');
        console.log('   1. Execute: npm run server');
        console.log('   2. Ou: start-port-3000.bat (Windows)');
        console.log('   3. Aguarde alguns segundos e teste novamente');
    }
    
    if (port3001Active) {
        console.log('\\n⚠️  PROBLEMA: Processo antigo ainda na porta 3001');
        console.log('🔧 Solução: Pare todos os processos Node e reinicie');
    }
    
    console.log('\\n🔄 Para testar novamente: node test-port-3000.js');
})();
`;

    fs.writeFileSync('test-port-3000.js', testScript);
    console.log('✅ Teste criado: test-port-3000.js');
}

// Executar todas as correções
function main() {
    console.log('🎯 Objetivo: Forçar backend para porta 3000\n');
    
    const success = fixServerApp();
    if (!success) {
        console.log('❌ Falha ao corrigir server/app.js');
        return;
    }
    
    fixEnvFile();
    fixPackageJson();
    createStartScript();
    createTest();
    
    console.log('\n================================================================');
    console.log(' CORREÇÃO CONCLUÍDA - BACKEND FORÇADO PARA PORTA 3000');
    console.log('================================================================\n');
    
    console.log('📝 ARQUIVOS MODIFICADOS:');
    console.log('   ✅ server/app.js - Forçado para porta 3000');
    console.log('   ✅ .env - PORT=3000 definido');
    console.log('   ✅ package.json - Scripts corrigidos');
    console.log('   ✅ Scripts de inicialização criados\n');
    
    console.log('🚀 PRÓXIMOS PASSOS:\n');
    
    console.log('   1. INSTALAR DEPENDÊNCIA (se necessário):');
    console.log('      npm install cross-env --save-dev\n');
    
    console.log('   2. INICIAR BACKEND (escolha uma opção):');
    console.log('      • npm run server');
    console.log('      • start-port-3000.bat (Windows)');
    console.log('      • ./start-port-3000.sh (Linux/Mac)\n');
    
    console.log('   3. TESTAR BACKEND:');
    console.log('      node test-port-3000.js\n');
    
    console.log('   4. INICIAR FRONTEND (outro terminal):');
    console.log('      npm run dev\n');
    
    console.log('🎯 URLs CORRETAS:');
    console.log('   Backend:  http://localhost:3000');
    console.log('   Frontend: http://localhost:5173');
    console.log('   API:      http://localhost:3000/api/health\n');
    
    console.log('✅ Agora o backend será forçado a rodar na porta 3000!');
}

// Executar
main();
