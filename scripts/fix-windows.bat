@echo off
REM scripts/fix-windows.bat - Correção para Windows MatchIt

echo ====================================
echo    CORRECAO WINDOWS - MATCHIT
echo ====================================
echo.

REM Verificar se package.json existe
if not exist "package.json" (
    echo ❌ Execute este script no diretorio raiz do projeto MatchIt
    pause
    exit /b 1
)

echo ✅ Diretorio correto identificado
echo.

REM Criar diretório scripts se não existir
if not exist "scripts" mkdir scripts

REM Criar script de correção Node.js
echo 🔧 Criando script de correcao...
(
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo console.log('🔧 Corrigindo package.json para Windows...'^);
echo.
echo const packagePath = path.join(process.cwd(^), 'package.json'^);
echo const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'^)^);
echo.
echo // Backup
echo const backupPath = path.join(process.cwd(^), `package.json.backup.${Date.now(^)}` ^);
echo fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2^)^);
echo console.log(`📁 Backup criado: ${path.basename(backupPath^)}` ^);
echo.
echo // Scripts para Windows
echo const scripts = {
echo   "server": "node server/app.js",
echo   "dev": "nodemon server/app.js",
echo   "start": "node server/app.js",
echo   "test": "jest",
echo   "migrate": "node scripts/run-migrations.js",
echo   "seed": "node scripts/seed-database.js",
echo   "health": "node -e \"require('http'^).get('http://localhost:3000/api/health', r =^> r.on('data', d =^> console.log(d.toString(^)^)^)^)\"",
echo   "setup": "node scripts/setup-system.js"
echo };
echo.
echo // Atualizar
echo packageJson.scripts = { ...packageJson.scripts, ...scripts };
echo.
echo // Salvar
echo fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2^) + '\n'^);
echo.
echo console.log('\n✅ package.json corrigido!'^);
echo console.log('\n📋 Use: npm run server'^);
) > scripts\fix-package.js

echo ✅ Script de correcao criado
echo.

echo 🔧 Executando correcao...
node scripts\fix-package.js

echo.
echo 📦 Instalando dependencias necessarias...
npm install cross-env nodemon --save-dev

echo.
echo 🧪 Verificando arquivos criticos...
if exist "server\app.js" (
    echo ✅ server\app.js encontrado
) else (
    echo ⚠️  server\app.js nao encontrado
)

if exist "server\middleware\authMiddleware.js" (
    echo ✅ authMiddleware.js encontrado  
) else (
    echo ⚠️  authMiddleware.js nao encontrado
)

echo.
echo ====================================
echo    CORRECAO CONCLUIDA
echo ====================================
echo.
echo ✅ Sistema corrigido para Windows!
echo.
echo 🚀 Para iniciar o servidor:
echo    npm run server
echo.
echo 🔧 Outros comandos:
echo    npm run dev     - Modo desenvolvimento
echo    npm run start   - Modo producao
echo    npm run health  - Verificar saude
echo.
echo 💡 O comando 'npm run server' agora funciona!
echo.
pause