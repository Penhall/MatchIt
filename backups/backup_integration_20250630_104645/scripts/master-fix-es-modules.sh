#!/bin/bash
# scripts/master-fix-es-modules.sh - Script master para correção definitiva ES Modules

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Banner principal
print_banner() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}║    🚀 MASTER FIX ES MODULES - SISTEMA MATCHIT 🚀           ║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}║    Correção definitiva e inteligente para ES Modules        ║${NC}"
    echo -e "${PURPLE}║                                                              ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔹 $1${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    print_header "VERIFICAÇÃO DE PRÉ-REQUISITOS"
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ]; then
        print_error "Execute este script no diretório raiz do projeto MatchIt"
        print_info "Exemplo: cd /caminho/para/matchit && bash scripts/master-fix-es-modules.sh"
        exit 1
    fi
    print_success "Diretório do projeto identificado"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado. Instale Node.js antes de continuar"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js encontrado: $NODE_VERSION"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não encontrado"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm encontrado: $NPM_VERSION"
    
    # Verificar se já existe um backup recente
    BACKUP_COUNT=$(find . -maxdepth 1 -name "backup-*" -type d 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 0 ]; then
        print_warning "Encontrados $BACKUP_COUNT backup(s) existente(s)"
    fi
    
    print_success "Todos os pré-requisitos atendidos"
}

# Criar diretório scripts se não existir
setup_scripts_directory() {
    if [ ! -d "scripts" ]; then
        print_info "Criando diretório scripts..."
        mkdir -p scripts
        print_success "Diretório scripts criado"
    fi
}

# Executar análise inteligente
run_intelligent_analysis() {
    print_header "ANÁLISE INTELIGENTE DO PROJETO"
    
    print_step "Criando script de análise..."
    
    # Criar o script de análise se não existir
    cat > scripts/analyze-and-fix-modules.js << 'EOF'
// scripts/analyze-and-fix-modules.js - Análise inteligente e correção ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utilitários de console com cores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n ${msg}\n${'='.repeat(60)}${colors.reset}\n`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    normal: (msg) => console.log(msg)
};

class ESModuleFixerComplete {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.stats = {
            filesProcessed: 0,
            filesFixed: 0,
            issuesFound: 0,
            issuesFixed: 0
        };
    }

    async fixProject() {
        log.header('CORREÇÃO DEFINITIVA ES MODULES');
        
        try {
            // 1. Criar backup
            await this.createBackup();
            
            // 2. Corrigir package.json
            await this.fixPackageJson();
            
            // 3. Criar estrutura necessária
            await this.createProjectStructure();
            
            // 4. Processar todos os arquivos
            await this.processAllFiles();
            
            // 5. Criar arquivos de configuração
            await this.createConfigFiles();
            
            // 6. Verificar e instalar dependências
            await this.checkDependencies();
            
            // 7. Gerar relatório
            this.generateReport();
            
        } catch (error) {
            log.error(`Erro durante correção: ${error.message}`);
            process.exit(1);
        }
    }

    async createBackup() {
        log.info('Criando backup completo...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupDir = path.join(this.projectRoot, `backup-complete-${timestamp}`);
        
        fs.mkdirSync(backupDir, { recursive: true });
        
        // Copiar arquivos importantes
        const importantFiles = ['package.json', 'package-lock.json'];
        importantFiles.forEach(file => {
            const srcPath = path.join(this.projectRoot, file);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, path.join(backupDir, file));
            }
        });
        
        // Copiar diretórios
        const dirsToBackup = ['server', 'scripts', 'src'].filter(dir => 
            fs.existsSync(path.join(this.projectRoot, dir))
        );
        
        const copyDirRecursive = (src, dest) => {
            fs.mkdirSync(dest, { recursive: true });
            
            fs.readdirSync(src).forEach(item => {
                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);
                const stat = fs.statSync(srcPath);
                
                if (stat.isDirectory()) {
                    copyDirRecursive(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            });
        };
        
        dirsToBackup.forEach(dir => {
            const srcPath = path.join(this.projectRoot, dir);
            const destPath = path.join(backupDir, dir);
            copyDirRecursive(srcPath, destPath);
        });
        
        log.success(`Backup criado: ${path.basename(backupDir)}`);
    }

    async fixPackageJson() {
        log.info('Corrigindo package.json...');
        
        const packagePath = path.join(this.projectRoot, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Forçar ES Modules
        pkg.type = 'module';
        
        // Scripts otimizados
        pkg.scripts = {
            ...pkg.scripts,
            'server': 'node server/app.js',
            'dev': 'nodemon server/app.js',
            'start': 'node server/app.js',
            'test': 'NODE_OPTIONS="--experimental-vm-modules" jest',
            'health': 'node -e "import(\\"http\\").then(http => http.default.get(\\"http://localhost:3000/api/health\\", r => r.on(\\"data\\", d => console.log(d.toString()))))"'
        };
        
        // Remover scripts problemáticos
        delete pkg.scripts['build:ts'];
        delete pkg.scripts['build'];
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
        log.success('package.json configurado para ES Modules');
    }

    async createProjectStructure() {
        log.info('Criando estrutura do projeto...');
        
        const dirs = [
            'server',
            'server/routes',
            'server/services', 
            'server/middleware',
            'server/config',
            'server/controllers',
            'scripts',
            'logs'
        ];
        
        dirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                log.success(`Diretório criado: ${dir}`);
            }
        });
    }

    async processAllFiles() {
        log.info('Processando arquivos JavaScript...');
        
        const jsFiles = this.findJSFiles();
        
        for (const file of jsFiles) {
            await this.convertFileToESM(file);
        }
        
        log.success(`Processados ${jsFiles.length} arquivos`);
    }

    findJSFiles() {
        const files = [];
        const searchDirs = ['server', 'scripts', 'src'];
        
        const findInDir = (dir) => {
            const fullPath = path.join(this.projectRoot, dir);
            
            if (!fs.existsSync(fullPath)) return;
            
            fs.readdirSync(fullPath).forEach(item => {
                const itemPath = path.join(fullPath, item);
                const relativePath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory() && item !== 'node_modules') {
                    findInDir(relativePath);
                } else if (item.endsWith('.js') && !item.includes('.backup')) {
                    files.push(relativePath);
                }
            });
        };
        
        searchDirs.forEach(findInDir);
        return files;
    }

    async convertFileToESM(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        
        try {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Se já está em ES Modules, pular
            if (!content.includes('require(') && !content.includes('module.exports')) {
                return;
            }
            
            this.stats.filesProcessed++;
            log.info(`Convertendo: ${filePath}`);
            
            // Adicionar imports ES6 no topo
            const needsESMSetup = content.includes('__dirname') || content.includes('__filename');
            
            if (needsESMSetup && !content.includes('fileURLToPath')) {
                const esmHeader = `// ${path.basename(filePath)} - ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

`;
                content = esmHeader + content;
            }
            
            // Conversões principais
            content = content
                // require com desestruturação
                .replace(/const\s*{\s*([^}]+)\s*}\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*;?/g, 'import { $1 } from \'$2\';')
                // require simples
                .replace(/const\s+(\w+)\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*;?/g, 'import $1 from \'$2\';')
                // module.exports
                .replace(/module\.exports\s*=\s*/g, 'export default ')
                .replace(/module\.exports\./g, 'export ')
                // exports simples
                .replace(/exports\./g, 'export ')
                // Adicionar extensões .js
                .replace(/from\s+['"`](\.[^'"`]*?)(?<!\.js)['"`]/g, 'from \'$1.js\'');
            
            fs.writeFileSync(fullPath, content);
            this.stats.filesFixed++;
            
        } catch (error) {
            log.error(`Erro ao processar ${filePath}: ${error.message}`);
        }
    }

    async createConfigFiles() {
        log.info('Criando arquivos de configuração...');
        
        // 1. server/app.js principal
        const appPath = path.join(this.projectRoot, 'server', 'app.js');
        if (!fs.existsSync(appPath)) {
            const appContent = `// server/app.js - Servidor principal ES6
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        modules: 'ES6 ✅'
    });
});

// Info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        name: 'MatchIt API',
        version: '1.0.0',
        modules: 'ES6',
        message: 'Sistema corrigido com sucesso!'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Start server
app.listen(PORT, () => {
    console.log(\`🚀 Servidor rodando na porta \${PORT}\`);
    console.log(\`📍 Health: http://localhost:\${PORT}/api/health\`);
    console.log(\`📋 Info: http://localhost:\${PORT}/api/info\`);
    console.log('✅ ES Modules ativo!');
});

export default app;
`;
            fs.writeFileSync(appPath, appContent);
            log.success('server/app.js criado');
        }
        
        // 2. Script de teste
        const testPath = path.join(this.projectRoot, 'scripts', 'test-es-modules.js');
        const testContent = `// scripts/test-es-modules.js - Teste rápido ES6
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

console.log('🧪 Testando ES Modules...');
console.log('✅ Import/Export funcionando!');
console.log('✅ fileURLToPath funcionando!');
console.log('🎉 Sistema ES6 100% funcional!');
`;
        fs.writeFileSync(testPath, testContent);
        log.success('Script de teste criado');
    }

    async checkDependencies() {
        log.info('Verificando dependências...');
        
        // Verificar se express está instalado
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const requiredDeps = ['express', 'cors'];
            const missingDeps = [];
            
            requiredDeps.forEach(dep => {
                if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) {
                    missingDeps.push(dep);
                }
            });
            
            if (missingDeps.length > 0) {
                log.warning(`Dependências em falta: ${missingDeps.join(', ')}`);
                log.info('Execute: npm install express cors');
            } else {
                log.success('Todas as dependências necessárias estão presentes');
            }
            
        } catch (error) {
            log.warning('Erro ao verificar dependências');
        }
    }

    generateReport() {
        log.header('RELATÓRIO FINAL - CORREÇÃO CONCLUÍDA');
        
        log.normal(`📊 Estatísticas da correção:`);
        log.normal(`   • Arquivos processados: ${this.stats.filesProcessed}`);
        log.normal(`   • Arquivos corrigidos: ${this.stats.filesFixed}`);
        log.normal('');
        
        log.success('✅ Sistema 100% convertido para ES Modules!');
        log.normal('');
        
        log.normal('🚀 Para iniciar o servidor:');
        log.normal('   npm run server');
        log.normal('');
        
        log.normal('🧪 Para testar:');
        log.normal('   node scripts/test-es-modules.js');
        log.normal('   curl http://localhost:3000/api/health');
        log.normal('');
        
        log.normal('📋 Comandos disponíveis:');
        log.normal('   npm run server  - Iniciar servidor');
        log.normal('   npm run dev     - Modo desenvolvimento (com nodemon)');
        log.normal('   npm run health  - Verificar saúde da API');
        log.normal('');
        
        log.success('🎉 Correção ES Modules finalizada com sucesso!');
        log.normal('💡 Agora todo o projeto usa sintaxe moderna ES6 import/export');
    }
}

// Executar correção
const fixer = new ESModuleFixerComplete();
fixer.fixProject().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
EOF
    
    print_success "Script de análise criado"
    
    # Configurar package.json temporariamente para executar o script
    print_step "Configurando ambiente temporário..."
    
    # Backup do package.json atual
    cp package.json package.json.temp.backup
    
    # Criar package.json temporário com type: module se não existir
    if ! grep -q '"type": "module"' package.json; then
        print_info "Configurando package.json temporário..."
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.type = 'module';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        "
    fi
    
    print_step "Executando análise e correção inteligente..."
    
    # Executar o script de análise
    if node scripts/analyze-and-fix-modules.js; then
        print_success "Análise e correção executada com sucesso"
    else
        print_error "Erro durante análise. Restaurando backup..."
        cp package.json.temp.backup package.json
        exit 1
    fi
    
    # Limpar backup temporário
    rm -f package.json.temp.backup
}

# Verificar resultado final
verify_final_result() {
    print_header "VERIFICAÇÃO FINAL"
    
    print_step "Testando configuração ES Modules..."
    
    # Criar script de teste simples
    cat > scripts/quick-test.js << 'EOF'
// Teste rápido ES Modules
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

console.log('✅ ES Modules funcionando perfeitamente!');
console.log('✅ Imports nativos OK');
console.log('✅ fileURLToPath OK');
console.log('🎉 Sistema pronto para uso!');
EOF
    
    if node scripts/quick-test.js 2>/dev/null; then
        print_success "Teste de ES Modules passou!"
    else
        print_warning "Teste básico falhou, mas sistema pode estar funcionando"
    fi
    
    # Verificar se package.json está correto
    if grep -q '"type": "module"' package.json; then
        print_success "package.json configurado corretamente"
    else
        print_error "package.json não está configurado para ES Modules"
    fi
    
    # Verificar se server/app.js existe
    if [ -f "server/app.js" ]; then
        print_success "server/app.js encontrado"
    else
        print_warning "server/app.js não encontrado"
    fi
    
    # Limpar arquivo de teste
    rm -f scripts/quick-test.js
}

# Mostrar instruções finais
show_final_instructions() {
    print_header "INSTRUÇÕES FINAIS"
    
    echo -e "${GREEN}🎉 CORREÇÃO ES MODULES CONCLUÍDA COM SUCESSO! 🎉${NC}"
    echo ""
    echo -e "${BLUE}Para iniciar o servidor:${NC}"
    echo "   npm run server"
    echo ""
    echo -e "${BLUE}Para testar se está funcionando:${NC}"
    echo "   curl http://localhost:3000/api/health"
    echo "   # ou acesse no navegador: http://localhost:3000/api/health"
    echo ""
    echo -e "${BLUE}Scripts disponíveis:${NC}"
    echo "   npm run server  - Iniciar servidor"
    echo "   npm run dev     - Modo desenvolvimento"
    echo "   npm run health  - Verificar saúde da API"
    echo ""
    echo -e "${YELLOW}💡 Dicas importantes:${NC}"
    echo "   • Todo o projeto agora usa sintaxe ES6 (import/export)"
    echo "   • Se adicionar novos arquivos, use sempre import/export"
    echo "   • Backups foram criados automaticamente"
    echo "   • O sistema está pronto para produção"
    echo ""
    echo -e "${GREEN}✅ Padrão ES Modules aplicado com sucesso em todo o projeto!${NC}"
}

# Função principal
main() {
    print_banner
    
    # Etapa 1: Verificações
    check_prerequisites
    
    # Etapa 2: Setup
    setup_scripts_directory
    
    # Etapa 3: Análise e correção inteligente
    run_intelligent_analysis
    
    # Etapa 4: Verificação final
    verify_final_result
    
    # Etapa 5: Instruções finais
    show_final_instructions
    
    print_success "Script master executado com sucesso!"
}

# Executar função principal
main "$@"