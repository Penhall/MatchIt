# scripts/fix-windows.sh - Script de correção para Windows

#!/bin/bash

echo "🔧 CORREÇÃO PARA WINDOWS - MATCHIT"
echo "=================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto MatchIt"
    exit 1
fi

echo "✅ Diretório correto identificado"

# Criar o script de correção JavaScript se não existir
mkdir -p scripts

# Script JavaScript inline para correção
cat > scripts/fix-windows-package.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo package.json para Windows...\n');

const packagePath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json não encontrado!');
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Backup
const backupPath = path.join(process.cwd(), `package.json.backup.${Date.now()}`);
fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
console.log(`📁 Backup criado: ${path.basename(backupPath)}`);

// Scripts compatíveis com Windows
const windowsScripts = {
    "server": "node server/app.js",
    "dev": "nodemon server/app.js",
    "start": "node server/app.js",
    "dev:env": "cross-env NODE_ENV=development nodemon server/app.js",
    "start:env": "cross-env NODE_ENV=production node server/app.js",
    "test": "jest",
    "migrate": "node scripts/run-migrations.js",
    "seed": "node scripts/seed-database.js",
    "health": "node -e \"require('http').get('http://localhost:3000/api/health', r => r.on('data', d => console.log(d.toString())))\"",
    "setup": "node scripts/setup-system.js"
};

// Atualizar scripts
packageJson.scripts = { ...packageJson.scripts, ...windowsScripts };

// Adicionar dependências de desenvolvimento se necessário
if (!packageJson.devDependencies) packageJson.devDependencies = {};

const devDeps = {
    "cross-env": "^7.0.3",
    "nodemon": "^3.0.0"
};

for (const [dep, version] of Object.entries(devDeps)) {
    if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies[dep]) {
        packageJson.devDependencies[dep] = version;
        console.log(`➕ Adicionada: ${dep}@${version}`);
    }
}

// Salvar
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('\n✅ package.json corrigido para Windows!');
console.log('\n📋 Comandos disponíveis:');
console.log('• npm run server    - Iniciar servidor (RECOMENDADO)');
console.log('• npm run dev       - Modo desenvolvimento com nodemon');
console.log('• npm run start     - Modo produção');
console.log('• npm run health    - Verificar saúde do sistema');
EOF

echo "🔧 Executando correção do package.json..."
node scripts/fix-windows-package.js

echo ""
echo "📦 Instalando dependências faltantes..."
npm install cross-env nodemon --save-dev

echo ""
echo "🧪 Testando configuração..."
if [ -f "server/app.js" ]; then
    echo "✅ server/app.js encontrado"
else
    echo "⚠️  server/app.js não encontrado - verifique a estrutura"
fi

if [ -f "server/middleware/authMiddleware.js" ]; then
    echo "✅ authMiddleware.js encontrado"
else
    echo "⚠️  authMiddleware.js não encontrado"
fi

echo ""
echo "================================================================"
echo " CORREÇÃO WINDOWS CONCLUÍDA"
echo "================================================================"
echo ""
echo "✅ Sistema corrigido para Windows!"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   npm run server"
echo ""
echo "🔧 Outros comandos úteis:"
echo "   npm run dev     - Modo desenvolvimento"
echo "   npm run health  - Verificar saúde"
echo "   npm run migrate - Executar migrações"
echo ""
echo "💡 O comando 'npm run server' agora funciona no Windows!"
echo ""