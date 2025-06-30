// scripts/fix-package-scripts.js - Correção dos scripts NPM para diferentes tipos de frontend

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGINDO SCRIPTS NPM PARA ACESSO AO FRONTEND');
console.log('================================================\n');

// Detectar tipo de projeto
function detectProjectType() {
    const hasVite = fs.existsSync('vite.config.js') || fs.existsSync('vite.config.ts');
    const hasExpo = fs.existsSync('app.json') || fs.existsSync('expo.json');
    const hasNext = fs.existsSync('next.config.js');
    
    if (hasVite) return 'vite';
    if (hasExpo) return 'expo';
    if (hasNext) return 'nextjs';
    return 'standard';
}

// Ler package.json
function readPackageJson() {
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
        console.error('❌ Erro ao ler package.json:', error.message);
        process.exit(1);
    }
}

// Salvar package.json
function savePackageJson(packageJson) {
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        
        // Backup
        const backupPath = path.join(process.cwd(), `package.json.backup.${Date.now()}`);
        fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
        console.log(`📁 Backup criado: ${path.basename(backupPath)}`);
        
        // Salvar
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ package.json atualizado');
    } catch (error) {
        console.error('❌ Erro ao salvar package.json:', error.message);
        process.exit(1);
    }
}

// Scripts para cada tipo de projeto
function getScriptsForProjectType(projectType) {
    const baseScripts = {
        "server": "node server/app.js",
        "backend": "node server/app.js",
        "start:server": "node server/app.js",
        "health": "node -e \"require('http').get('http://localhost:3001/api/health', r => r.on('data', d => console.log(d.toString())))\"",
        "test:connection": "node -e \"require('http').get('http://localhost:3001/api/health', r => r.on('data', d => console.log('✅ Backend OK:', d.toString()))).on('error', e => console.log('❌ Backend Error:', e.message))\""
    };
    
    switch (projectType) {
        case 'vite':
            return {
                ...baseScripts,
                "dev": "vite",
                "build": "vite build",
                "preview": "vite preview",
                "start": "vite",
                "frontend": "vite",
                "start:frontend": "vite",
                "dev:full": "concurrently \"npm run server\" \"npm run dev\"",
                "test:frontend": "node -e \"require('http').get('http://localhost:5173', r => console.log('✅ Frontend OK')).on('error', e => console.log('❌ Frontend Error:', e.message))\""
            };
            
        case 'expo':
            return {
                ...baseScripts,
                "start": "expo start",
                "android": "expo start --android",
                "ios": "expo start --ios",
                "web": "expo start --web",
                "frontend": "expo start",
                "start:frontend": "expo start",
                "dev:full": "concurrently \"npm run server\" \"npm run start\"",
                "test:frontend": "node -e \"require('http').get('http://localhost:8081', r => console.log('✅ Frontend OK')).on('error', e => console.log('❌ Frontend Error:', e.message))\""
            };
            
        case 'nextjs':
            return {
                ...baseScripts,
                "dev": "next dev -p 3002",
                "build": "next build",
                "start": "next start -p 3002",
                "frontend": "next dev -p 3002",
                "start:frontend": "next dev -p 3002",
                "dev:full": "concurrently \"npm run server\" \"npm run dev\"",
                "test:frontend": "node -e \"require('http').get('http://localhost:3002', r => console.log('✅ Frontend OK')).on('error', e => console.log('❌ Frontend Error:', e.message))\""
            };
            
        default:
            return {
                ...baseScripts,
                "dev": "nodemon server/app.js",
                "start": "node server/app.js",
                "build": "echo 'No build process defined'",
                "frontend": "echo 'Frontend type not detected - check project structure'",
                "dev:full": "nodemon server/app.js"
            };
    }
}

// Dependências recomendadas para cada tipo
function getDependenciesForProjectType(projectType) {
    const baseDeps = {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "dotenv": "^16.0.3"
    };
    
    const baseDevDeps = {
        "nodemon": "^3.0.1",
        "concurrently": "^8.2.0"
    };
    
    switch (projectType) {
        case 'vite':
            return {
                dependencies: {
                    ...baseDeps,
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "axios": "^1.4.0"
                },
                devDependencies: {
                    ...baseDevDeps,
                    "@vitejs/plugin-react": "^4.0.3",
                    "vite": "^4.4.5"
                }
            };
            
        case 'expo':
            return {
                dependencies: {
                    ...baseDeps,
                    "expo": "~49.0.0",
                    "react": "18.2.0",
                    "react-native": "0.72.0"
                },
                devDependencies: {
                    ...baseDevDeps,
                    "@babel/core": "^7.20.0"
                }
            };
            
        case 'nextjs':
            return {
                dependencies: {
                    ...baseDeps,
                    "next": "13.4.0",
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0"
                },
                devDependencies: {
                    ...baseDevDeps,
                    "@types/node": "^20.0.0",
                    "@types/react": "^18.2.0"
                }
            };
            
        default:
            return {
                dependencies: baseDeps,
                devDependencies: baseDevDeps
            };
    }
}

// Função principal
function main() {
    const projectType = detectProjectType();
    console.log(`🔍 Tipo de projeto detectado: ${projectType.toUpperCase()}`);
    
    const packageJson = readPackageJson();
    console.log(`📋 Projeto: ${packageJson.name || 'sem nome'} v${packageJson.version || '1.0.0'}`);
    
    // Atualizar scripts
    const newScripts = getScriptsForProjectType(projectType);
    packageJson.scripts = { ...packageJson.scripts, ...newScripts };
    
    // Configurar type para ES modules se não existir
    if (!packageJson.type) {
        packageJson.type = 'module';
        console.log('✅ Configurado para ES Modules');
    }
    
    // Adicionar dependências se necessário
    const recommendedDeps = getDependenciesForProjectType(projectType);
    
    // Garantir que existem as seções de dependências
    if (!packageJson.dependencies) packageJson.dependencies = {};
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    
    // Adicionar dependências faltantes
    let addedDeps = 0;
    for (const [dep, version] of Object.entries(recommendedDeps.dependencies)) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
            packageJson.dependencies[dep] = version;
            addedDeps++;
        }
    }
    
    for (const [dep, version] of Object.entries(recommendedDeps.devDependencies)) {
        if (!packageJson.devDependencies[dep] && !packageJson.dependencies[dep]) {
            packageJson.devDependencies[dep] = version;
            addedDeps++;
        }
    }
    
    if (addedDeps > 0) {
        console.log(`✅ ${addedDeps} dependências recomendadas adicionadas`);
    }
    
    // Salvar package.json
    savePackageJson(packageJson);
    
    // Mostrar comandos disponíveis
    console.log('\n📋 COMANDOS DISPONÍVEIS:');
    console.log('========================');
    
    switch (projectType) {
        case 'vite':
            console.log('Backend:');
            console.log('  npm run server     - Iniciar backend (porta 3001)');
            console.log('  npm run backend    - Alias para server');
            console.log('');
            console.log('Frontend:');
            console.log('  npm run dev        - Iniciar frontend Vite (porta 5173)');
            console.log('  npm run frontend   - Alias para dev');
            console.log('  npm run build      - Build para produção');
            console.log('  npm run preview    - Preview do build');
            console.log('');
            console.log('Ambos:');
            console.log('  npm run dev:full   - Backend + Frontend simultaneamente');
            break;
            
        case 'expo':
            console.log('Backend:');
            console.log('  npm run server     - Iniciar backend (porta 3000)');
            console.log('  npm run backend    - Alias para server');
            console.log('');
            console.log('Frontend:');
            console.log('  npm start          - Iniciar Expo Metro (porta 8081)');
            console.log('  npm run android    - Abrir no Android');
            console.log('  npm run ios        - Abrir no iOS');
            console.log('  npm run web        - Abrir no navegador');
            console.log('');
            console.log('Ambos:');
            console.log('  npm run dev:full   - Backend + Frontend simultaneamente');
            break;
            
        case 'nextjs':
            console.log('Backend:');
            console.log('  npm run server     - Iniciar backend (porta 3001)');
            console.log('  npm run backend    - Alias para server');
            console.log('');
            console.log('Frontend:');
            console.log('  npm run dev        - Iniciar Next.js (porta 3002)');
            console.log('  npm run build      - Build para produção');
            console.log('  npm start          - Iniciar produção');
            console.log('');
            console.log('Ambos:');
            console.log('  npm run dev:full   - Backend + Frontend simultaneamente');
            break;
            
        default:
            console.log('Backend apenas:');
            console.log('  npm run server     - Iniciar backend');
            console.log('  npm run dev        - Iniciar com nodemon');
            console.log('  npm start          - Iniciar produção');
            break;
    }
    
    console.log('');
    console.log('Testes:');
    console.log('  npm run health         - Testar saúde do backend');
    console.log('  npm run test:connection - Testar conexão');
    console.log('  npm run test:frontend   - Testar frontend');
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('==================');
    console.log('1. Instalar dependências: npm install');
    
    switch (projectType) {
        case 'vite':
            console.log('2. Terminal 1: npm run server    (backend porta 3001)');
            console.log('3. Terminal 2: npm run dev       (frontend porta 5173)');
            console.log('4. Abrir: http://localhost:5173');
            break;
            
        case 'expo':
            console.log('2. Terminal 1: npm run server    (backend porta 3000)');
            console.log('3. Terminal 2: npm start         (Expo Metro porta 8081)');
            console.log('4. Usar app Expo Go ou simulador');
            break;
            
        case 'nextjs':
            console.log('2. Terminal 1: npm run server    (backend porta 3001)');
            console.log('3. Terminal 2: npm run dev       (frontend porta 3002)');
            console.log('4. Abrir: http://localhost:3002');
            break;
            
        default:
            console.log('2. npm run server    (iniciar backend)');
            console.log('3. Configurar frontend separadamente');
            break;
    }
    
    console.log('\n✅ Scripts NPM configurados com sucesso!');
    
    // Criar arquivo de instruções
    const instructions = `# Instruções de Uso - ${packageJson.name}

## Tipo de Projeto: ${projectType.toUpperCase()}

### Comandos Principais

#### Backend
- \`npm run server\` - Iniciar servidor backend
- \`npm run health\` - Testar saúde do sistema

#### Frontend (${projectType})
${projectType === 'vite' ? `- \`npm run dev\` - Servidor de desenvolvimento (porta 5173)
- \`npm run build\` - Build para produção
- \`npm run preview\` - Preview do build` : ''}
${projectType === 'expo' ? `- \`npm start\` - Iniciar Metro bundler (porta 8081)
- \`npm run android\` - Abrir no Android
- \`npm run ios\` - Abrir no iOS
- \`npm run web\` - Abrir no navegador` : ''}
${projectType === 'nextjs' ? `- \`npm run dev\` - Servidor de desenvolvimento (porta 3002)
- \`npm run build\` - Build para produção
- \`npm start\` - Servidor de produção` : ''}

#### Desenvolvimento Completo
- \`npm run dev:full\` - Backend + Frontend simultaneamente

### URLs de Acesso
${projectType === 'vite' ? '- Frontend: http://localhost:5173\n- Backend: http://localhost:3001' : ''}
${projectType === 'expo' ? '- Metro: http://localhost:8081\n- Backend: http://localhost:3000' : ''}
${projectType === 'nextjs' ? '- Frontend: http://localhost:3002\n- Backend: http://localhost:3001' : ''}

---
Configuração gerada em: ${new Date().toISOString()}
`;

    fs.writeFileSync('COMO_USAR.md', instructions);
    console.log('📝 Arquivo COMO_USAR.md criado com instruções detalhadas');
}

// Executar
main();
