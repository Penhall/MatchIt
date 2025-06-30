@echo off
REM windows-fix-3000.bat - Correção específica para Windows

echo 🔧 CORREÇÃO WINDOWS - BACKEND PORTA 3000
echo =========================================
echo.

REM Verificar se estamos no diretório correto
if not exist package.json (
    echo ❌ Execute este script no diretório raiz do projeto MatchIt
    pause
    exit /b 1
)

echo ✅ Diretório correto identificado
echo 🎯 Configurando backend para porta 3000...
echo.

REM Parar processos Node existentes
echo 🔧 Parando processos Node.js existentes...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    echo    Nenhum processo Node encontrado
) else (
    echo    ✅ Processos Node parados
)
echo.

REM Instalar cross-env se necessário
echo 📦 Verificando dependências...
npm list cross-env >nul 2>&1
if errorlevel 1 (
    echo    Instalando cross-env...
    npm install cross-env --save-dev
    echo    ✅ cross-env instalado
) else (
    echo    ✅ cross-env já instalado
)
echo.

REM Executar correção JavaScript
echo 🔧 Executando correções de configuração...
node -e "
const fs = require('fs');

// 1. Corrigir .env
console.log('📝 Corrigindo .env...');
const envContent = `NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123
JWT_SECRET=matchit_secret_key_development_2024
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000
LOG_LEVEL=debug`;

if (fs.existsSync('.env')) {
    fs.copyFileSync('.env', '.env.backup.' + Date.now());
}
fs.writeFileSync('.env', envContent);
console.log('✅ .env configurado');

// 2. Corrigir package.json
console.log('📝 Corrigindo package.json...');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
fs.writeFileSync('package.json.backup.' + Date.now(), JSON.stringify(pkg, null, 2));

pkg.scripts = pkg.scripts || {};
pkg.scripts.server = 'cross-env PORT=3000 node server/app.js';
pkg.scripts.backend = 'cross-env PORT=3000 node server/app.js';
pkg.scripts.health = 'node -e \"require(\\\"http\\\").get(\\\"http://localhost:3000/api/health\\\", r => r.on(\\\"data\\\", d => console.log(d.toString())))\"';
pkg.scripts.dev = 'vite';
pkg.scripts.frontend = 'vite';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ package.json corrigido');

// 3. Criar teste
console.log('📝 Criando teste...');
const testScript = `const http = require('http');
console.log('🧪 Testando porta 3000...');
const req = http.get('http://localhost:3000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Backend OK na porta 3000');
    console.log('📄', data);
  });
}).on('error', (err) => {
  console.log('❌ Backend não responde na porta 3000');
  console.log('🔧 Execute: npm run server');
});`;

fs.writeFileSync('test-3000.js', testScript);
console.log('✅ Teste criado');
"

echo.
echo ✅ Configurações corrigidas!
echo.

REM Criar script de inicialização
echo 📝 Criando script de inicialização...
echo @echo off > start-backend-3000.bat
echo echo 🚀 Iniciando Backend MatchIt - Porta 3000 >> start-backend-3000.bat
echo echo ======================================== >> start-backend-3000.bat
echo echo. >> start-backend-3000.bat
echo echo 🔧 Parando processos anteriores... >> start-backend-3000.bat
echo taskkill /F /IM node.exe ^>nul 2^>^&1 >> start-backend-3000.bat
echo echo. >> start-backend-3000.bat
echo echo 🚀 Iniciando backend na porta 3000... >> start-backend-3000.bat
echo echo    URL: http://localhost:3000 >> start-backend-3000.bat
echo echo    Health: http://localhost:3000/api/health >> start-backend-3000.bat
echo echo. >> start-backend-3000.bat
echo set PORT=3000 >> start-backend-3000.bat
echo npm run server >> start-backend-3000.bat
echo pause >> start-backend-3000.bat

echo ✅ Script start-backend-3000.bat criado
echo.

REM Testar configuração atual
echo 🧪 Testando se há algum servidor rodando...
node -e "
const http = require('http');
console.log('🔍 Verificando porta 3000...');
http.get('http://localhost:3000/api/health', (res) => {
  console.log('✅ Backend já está rodando na porta 3000!');
}).on('error', () => {
  console.log('ℹ️  Nenhum servidor na porta 3000 (normal)');
});

console.log('🔍 Verificando porta 3001...');
http.get('http://localhost:3001/api/health', (res) => {
  console.log('⚠️  ATENÇÃO: Servidor ainda rodando na porta 3001');
  console.log('🔧 Pare o processo e use start-backend-3000.bat');
}).on('error', () => {
  console.log('✅ Porta 3001 livre (correto)');
});
" 2>nul

echo.
echo ================================================================
echo  CORREÇÃO CONCLUÍDA - WINDOWS
echo ================================================================
echo.
echo 📝 ARQUIVOS CRIADOS/MODIFICADOS:
echo    ✅ .env - Configurado para porta 3000
echo    ✅ package.json - Scripts corrigidos
echo    ✅ start-backend-3000.bat - Script de inicialização
echo    ✅ test-3000.js - Teste de conectividade
echo.
echo 🚀 PRÓXIMOS PASSOS:
echo.
echo    1. INICIAR BACKEND:
echo       start-backend-3000.bat
echo.
echo    2. TESTAR BACKEND (em outro prompt):
echo       node test-3000.js
echo.
echo    3. INICIAR FRONTEND (em outro prompt):
echo       npm run dev
echo.
echo 🎯 URLs CORRETAS:
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:5173
echo    API:      http://localhost:3000/api/health
echo.
echo ✅ Configuração para Windows concluída!
echo.
echo 💡 DICA: Use start-backend-3000.bat para iniciar sempre na porta 3000
echo.
pause
