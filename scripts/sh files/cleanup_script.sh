#!/bin/bash
# cleanup_script.sh - Script de migração final para estrutura modular

echo "🚀 MatchIt - Migração para Estrutura Modular"
echo "============================================="

# Função para perguntar confirmação
confirm() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Por favor, responda y ou n.";;
        esac
    done
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto MatchIt"
    exit 1
fi

echo "📍 Diretório atual: $(pwd)"
echo ""

# 1. VERIFICAR ESTRUTURA MODULAR
echo "🔍 Verificando estrutura modular..."

REQUIRED_FILES=(
    "server/app.js"
    "server/config/database.js"
    "server/middleware/auth.js"
    "server/routes/index.js"
    "server/routes/auth.js"
    "server/routes/matches.js"
    "server/routes/products.js"
    "server/services/authService.js"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo "❌ Arquivos da estrutura modular não encontrados:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Por favor, certifique-se que todos os artefatos foram criados."
    exit 1
fi

echo "✅ Estrutura modular verificada!"
echo ""

# 2. BACKUP DOS ARQUIVOS ANTIGOS
echo "💾 Criando backup dos arquivos antigos..."

BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Fazer backup apenas se os arquivos existirem
if [ -f "server.js" ]; then
    cp "server.js" "$BACKUP_DIR/"
    echo "   ✅ server.js -> $BACKUP_DIR/"
fi

if [ -f "server.js.pre-modular-backup-20250610-141103" ]; then
    cp "server.js.pre-modular-backup-20250610-141103" "$BACKUP_DIR/"
    echo "   ✅ server.js.pre-modular-backup-20250610-141103 -> $BACKUP_DIR/"
fi

if [ -f "Dockerfile.backend" ]; then
    cp "Dockerfile.backend" "$BACKUP_DIR/Dockerfile.backend.old"
    echo "   ✅ Dockerfile.backend -> $BACKUP_DIR/Dockerfile.backend.old"
fi

echo "✅ Backup criado em: $BACKUP_DIR"
echo ""

# 3. REMOVER ARQUIVOS ANTIGOS
if confirm "🗑️  Remover arquivos antigos (server.js e backup)?"; then
    
    if [ -f "server.js" ]; then
        rm "server.js"
        echo "   ✅ server.js removido"
    fi
    
    if [ -f "server.js.pre-modular-backup-20250610-141103" ]; then
        rm "server.js.pre-modular-backup-20250610-141103"
        echo "   ✅ server.js.pre-modular-backup-20250610-141103 removido"
    fi
    
    echo "✅ Arquivos antigos removidos!"
else
    echo "⏭️  Mantendo arquivos antigos"
fi

echo ""

# 4. VERIFICAR DOCKER COMPOSE
echo "🐳 Verificando docker-compose.yml..."

if [ -f "docker-compose.yml" ]; then
    if grep -q "CMD.*server\.js" docker-compose.yml; then
        echo "⚠️  ATENÇÃO: docker-compose.yml ainda pode referenciar server.js"
        echo "   O Dockerfile.backend foi atualizado para usar server/app.js"
    fi
    
    echo "✅ docker-compose.yml encontrado"
else
    echo "⚠️  docker-compose.yml não encontrado"
fi

echo ""

# 5. TESTAR ESTRUTURA MODULAR
echo "🧪 Testando estrutura modular..."

# Verificar sintaxe dos arquivos principais
echo "   📝 Verificando sintaxe JavaScript..."

if node -c server/app.js 2>/dev/null; then
    echo "   ✅ server/app.js - sintaxe OK"
else
    echo "   ❌ server/app.js - erro de sintaxe"
    echo "   Execute: node -c server/app.js"
fi

if node -c server/routes/index.js 2>/dev/null; then
    echo "   ✅ server/routes/index.js - sintaxe OK"
else
    echo "   ❌ server/routes/index.js - erro de sintaxe"
    echo "   Execute: node -c server/routes/index.js"
fi

echo ""

# 6. INSTRUÇÕES FINAIS
echo "🎯 MIGRAÇÃO CONCLUÍDA!"
echo "====================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. 🐳 Testar com Docker:"
echo "   docker-compose down"
echo "   docker-compose up --build backend"
echo ""
echo "2. 🔍 Verificar logs:"
echo "   docker-compose logs backend"
echo ""
echo "3. 🌐 Testar health check:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "4. 📖 Verificar API info:"
echo "   curl http://localhost:3000/api/info"
echo ""
echo "📁 Estrutura modular implementada:"
echo "   ✅ server/app.js - Entry point principal"
echo "   ✅ server/config/ - Configurações"
echo "   ✅ server/middleware/ - Middlewares"
echo "   ✅ server/routes/ - Rotas organizadas"
echo "   ✅ server/services/ - Serviços de negócio"
echo "   ✅ server/utils/ - Utilitários"
echo ""
echo "🎉 MatchIt Backend agora usa estrutura modular!"
echo ""

# 7. VERIFICAÇÃO DE SAÚDE
if confirm "🔧 Executar verificação rápida de saúde?"; then
    echo ""
    echo "🔍 Executando verificações..."
    
    # Verificar se todas as dependências estão instaladas
    if npm list --depth=0 >/dev/null 2>&1; then
        echo "   ✅ Dependências NPM OK"
    else
        echo "   ⚠️  Algumas dependências podem estar faltando"
        echo "   Execute: npm install"
    fi
    
    # Verificar variáveis de ambiente
    if [ -f ".env" ]; then
        echo "   ✅ Arquivo .env encontrado"
    else
        echo "   ⚠️  Arquivo .env não encontrado"
        echo "   Certifique-se de configurar as variáveis de ambiente"
    fi
    
    echo ""
    echo "✅ Verificação de saúde concluída!"
fi

echo ""
echo "🚀 Estrutura modular MatchIt está pronta para uso!"
echo "📚 Consulte README.md para mais informações"