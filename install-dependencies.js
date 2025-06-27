// install-dependencies.js - Instalação completa de dependências MatchIt
const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 INSTALANDO DEPENDÊNCIAS - MATCHIT');
console.log('=====================================\n');

// Dependências principais necessárias
const requiredDependencies = [
    'express@^4.18.2',
    'pg@^8.11.0',
    'bcrypt@^5.1.0',
    'jsonwebtoken@^9.0.0',
    'cors@^2.8.5',
    'helmet@^7.0.0',
    'dotenv@^16.0.0',
    'compression@^1.7.4',
    'express-rate-limit@^6.7.0',
    'multer@^1.4.5-lts.2',
    'express-validator@^7.0.0'
];

// Dependências de desenvolvimento
const devDependencies = [
    'nodemon@^3.0.0',
    'cross-env@^7.0.3',
    'jest@^29.0.0',
    'eslint@^8.57.0',
    'prettier@^3.0.0'
];

function executeCommand(command, description) {
    try {
        console.log(`🔧 ${description}...`);
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} - Concluído\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} - Erro:`, error.message);
        return false;
    }
}

function checkPackageJson() {
    if (!fs.existsSync('package.json')) {
        console.error('❌ package.json não encontrado!');
        process.exit(1);
    }
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📋 Projeto: ${packageJson.name} v${packageJson.version}`);
    return packageJson;
}

function updatePackageJson(packageJson) {
    console.log('📝 Atualizando package.json...');
    
    // Garantir que dependencies existe
    if (!packageJson.dependencies) packageJson.dependencies = {};
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    
    // Adicionar dependências principais se não existirem
    const missingDeps = [];
    requiredDependencies.forEach(dep => {
        const [name, version] = dep.split('@');
        if (!packageJson.dependencies[name]) {
            packageJson.dependencies[name] = version.replace('^', '') || 'latest';
            missingDeps.push(name);
        }
    });
    
    // Adicionar dependências de desenvolvimento
    const missingDevDeps = [];
    devDependencies.forEach(dep => {
        const [name, version] = dep.split('@');
        if (!packageJson.devDependencies[name]) {
            packageJson.devDependencies[name] = version.replace('^', '') || 'latest';
            missingDevDeps.push(name);
        }
    });
    
    // Scripts essenciais
    const essentialScripts = {
        "server": "node server/app.js",
        "dev": "cross-env NODE_ENV=development nodemon server/app.js",
        "start": "cross-env NODE_ENV=production node server/app.js",
        "test": "cross-env NODE_ENV=test jest",
        "migrate": "node scripts/run-migrations.js",
        "seed": "node scripts/seed-database.js",
        "health": "node -e \"require('http').get('http://localhost:3000/api/health', r => r.on('data', d => console.log(d.toString())))\""
    };
    
    packageJson.scripts = { ...packageJson.scripts, ...essentialScripts };
    
    // Salvar package.json atualizado
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    
    if (missingDeps.length > 0) {
        console.log(`➕ Dependências adicionadas: ${missingDeps.join(', ')}`);
    }
    if (missingDevDeps.length > 0) {
        console.log(`➕ Dev dependências adicionadas: ${missingDevDeps.join(', ')}`);
    }
    
    console.log('✅ package.json atualizado\n');
}

function installDependencies() {
    console.log('📦 Instalando dependências...\n');
    
    // Limpar cache npm (pode resolver problemas)
    console.log('🧹 Limpando cache npm...');
    try {
        execSync('npm cache clean --force', { stdio: 'inherit' });
        console.log('✅ Cache limpo\n');
    } catch (error) {
        console.log('⚠️  Não foi possível limpar cache\n');
    }
    
    // Instalar dependências principais
    if (!executeCommand('npm install', 'Instalando dependências principais')) {
        console.log('\n⚠️  Tentando instalação individual...\n');
        
        // Tentar instalar bcrypt especificamente (pode ter problemas de compilação)
        console.log('🔑 Instalando bcrypt (pode demorar)...');
        try {
            execSync('npm install bcrypt@^5.1.0', { stdio: 'inherit' });
            console.log('✅ bcrypt instalado\n');
        } catch (error) {
            console.log('❌ Erro no bcrypt. Tentando alternativa...');
            try {
                execSync('npm install bcryptjs@^2.4.3', { stdio: 'inherit' });
                console.log('✅ bcryptjs instalado como alternativa\n');
                
                // Atualizar auth.js para usar bcryptjs
                console.log('🔧 Atualizando auth.js para usar bcryptjs...');
                updateAuthFile();
            } catch (altError) {
                console.error('❌ Erro ao instalar bcrypt/bcryptjs:', altError.message);
            }
        }
        
        // Instalar outras dependências críticas individualmente
        const criticalDeps = ['express', 'pg', 'jsonwebtoken', 'cors', 'helmet', 'dotenv'];
        criticalDeps.forEach(dep => {
            try {
                execSync(`npm install ${dep}`, { stdio: 'inherit' });
                console.log(`✅ ${dep} instalado`);
            } catch (error) {
                console.error(`❌ Erro ao instalar ${dep}:`, error.message);
            }
        });
    }
}

function updateAuthFile() {
    const authPath = 'server/routes/auth.js';
    if (fs.existsSync(authPath)) {
        let authContent = fs.readFileSync(authPath, 'utf8');
        if (authContent.includes("require('bcrypt')")) {
            authContent = authContent.replace("require('bcrypt')", "require('bcryptjs')");
            fs.writeFileSync(authPath, authContent);
            console.log('✅ auth.js atualizado para usar bcryptjs');
        }
    }
}

function testInstallation() {
    console.log('🧪 Testando instalação...\n');
    
    const testScript = `
        try {
            console.log('Testando módulos...');
            require('express');
            console.log('✅ express');
            require('pg');
            console.log('✅ pg');
            try {
                require('bcrypt');
                console.log('✅ bcrypt');
            } catch (e) {
                require('bcryptjs');
                console.log('✅ bcryptjs (alternativa)');
            }
            require('jsonwebtoken');
            console.log('✅ jsonwebtoken');
            require('cors');
            console.log('✅ cors');
            require('helmet');
            console.log('✅ helmet');
            require('dotenv');
            console.log('✅ dotenv');
            console.log('\\n🎉 Todos os módulos principais estão instalados!');
        } catch (error) {
            console.error('❌ Erro no teste:', error.message);
            process.exit(1);
        }
    `;
    
    try {
        execSync(`node -e "${testScript}"`, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error('❌ Teste de instalação falhou');
        return false;
    }
}

// Execução principal
async function main() {
    try {
        // 1. Verificar package.json
        const packageJson = checkPackageJson();
        
        // 2. Atualizar package.json
        updatePackageJson(packageJson);
        
        // 3. Instalar dependências
        installDependencies();
        
        // 4. Testar instalação
        if (testInstallation()) {
            console.log('\n' + '='.repeat(50));
            console.log('🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('='.repeat(50));
            console.log('\n🚀 Para iniciar o servidor:');
            console.log('   npm run server');
            console.log('\n🔧 Outros comandos:');
            console.log('   npm run dev     - Modo desenvolvimento');
            console.log('   npm run health  - Verificar saúde');
            console.log('   npm run migrate - Executar migrações');
            console.log('\n💡 Se ainda houver erros, execute:');
            console.log('   npm run health  - Para diagnosticar');
        } else {
            console.log('\n⚠️  Instalação com problemas. Verifique os logs acima.');
        }
        
    } catch (error) {
        console.error('\n❌ Erro na instalação:', error.message);
        console.log('\n📋 SOLUÇÃO MANUAL:');
        console.log('1. npm install bcrypt express pg jsonwebtoken cors helmet dotenv');
        console.log('2. npm run server');
    }
}

main();