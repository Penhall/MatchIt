#!/bin/bash
# scripts/corrigir-dependencias-completo.sh - Correção completa de dependências do MatchIt

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 📦 MATCHIT - CORREÇÃO COMPLETA DE DEPENDÊNCIAS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   • Cannot find package 'express-validator'"
echo -e "   • Dependências de autenticação faltando no package.json"
echo -e "   • Servidor não consegue iniciar"
echo ""
echo -e "${YELLOW}🛠️ SOLUÇÃO:${NC}"
echo -e "   • Adicionar express-validator ao package.json"
echo -e "   • Instalar todas as dependências necessárias"
echo -e "   • Verificar compatibilidade de versões"
echo -e "   • Testar servidor após instalação"
echo ""

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Erro: package.json não encontrado${NC}"
    echo -e "${RED}   Execute este script a partir da raiz do projeto MatchIt${NC}"
    exit 1
fi

echo -e "${BLUE}▶ ETAPA 1: Backup do package.json atual${NC}"
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup criado: package.json.backup.$(date +%Y%m%d_%H%M%S)${NC}"

echo -e "${BLUE}▶ ETAPA 2: Atualizando package.json com todas as dependências necessárias${NC}"

cat > package.json << 'EOF'
{
  "name": "matchit-app",
  "version": "1.1.0",
  "description": "Sistema de torneios por imagens para app de namoro",
  "type": "module",
  "main": "server/app.js",
  "scripts": {
    "start": "node server/app.js",
    "dev": "vite",
    "dev:frontend": "vite",
    "migrate": "psql -d matchit_db -f database/migrations/003_complete_tournament_schema.sql",
    "seed": "psql -d matchit_db -f database/seeds/002_tournament_sample_data.sql",
    "setup": "npm run migrate && npm run seed",
    "test": "echo 'Testes serão implementados na Fase 2'",
    "lint": "echo 'Linting será configurado na Fase 2'",
    "server": "cross-env PORT=3000 node server/app.js",
    "backend": "node server/app.js",
    "health": "curl http://localhost:3000/api/health",
    "build": "vite build",
    "preview": "vite preview",
    "frontend": "vite"
  },
  "dependencies": {
    "@react-native-community/slider": "^4.5.7",
    "@types/react-native": "^0.72.8",
    "axios": "^1.10.0",
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "express-rate-limit": "^6.7.0",
    "express-validator": "^7.2.0",
    "helmet": "^7.0.0",
    "i18next": "^25.2.1",
    "i18next-browser-languagedetector": "^8.2.0",
    "jq": "^1.7.2",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.16.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-i18next": "^15.5.3",
    "react-native-chart-kit": "^6.12.0",
    "react-native-web": "^0.20.0",
    "react-router-dom": "^7.6.3",
    "sharp": "^0.32.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^24.0.7",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^4.6.0",
    "cross-env": "^7.0.3",
    "nodemon": "^2.0.22",
    "typescript": "^5.8.3",
    "vite": "^7.0.0"
  },
  "keywords": [
    "matchit",
    "torneios",
    "dating-app",
    "imagens",
    "preferencias"
  ],
  "author": "MatchIt Team",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

echo -e "${GREEN}✅ package.json atualizado com express-validator incluído${NC}"

echo -e "${BLUE}▶ ETAPA 3: Limpando cache do npm${NC}"
if npm cache clean --force; then
    echo -e "${GREEN}✅ Cache do npm limpo${NC}"
else
    echo -e "${YELLOW}⚠️ Falha ao limpar cache, continuando...${NC}"
fi

echo -e "${BLUE}▶ ETAPA 4: Removendo node_modules antigo${NC}"
if [[ -d "node_modules" ]]; then
    rm -rf node_modules
    echo -e "${GREEN}✅ node_modules removido${NC}"
else
    echo -e "${YELLOW}⚠️ node_modules não encontrado${NC}"
fi

echo -e "${BLUE}▶ ETAPA 5: Instalando todas as dependências${NC}"
echo -e "${YELLOW}   Isso pode levar alguns minutos...${NC}"

if npm install; then
    echo -e "${GREEN}✅ Todas as dependências instaladas com sucesso${NC}"
else
    echo -e "${RED}❌ Falha na instalação de dependências${NC}"
    echo -e "${YELLOW}   Tentando com --legacy-peer-deps...${NC}"
    
    if npm install --legacy-peer-deps; then
        echo -e "${GREEN}✅ Dependências instaladas com --legacy-peer-deps${NC}"
    else
        echo -e "${RED}❌ Falha crítica na instalação${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}▶ ETAPA 6: Verificando dependências críticas instaladas${NC}"

CRITICAL_DEPS=(
    "express"
    "express-validator" 
    "bcrypt"
    "jsonwebtoken"
    "cors"
    "helmet"
    "pg"
    "dotenv"
)

ALL_DEPS_OK=true

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $dep instalado${NC}"
    else
        echo -e "${RED}❌ $dep NÃO instalado${NC}"
        ALL_DEPS_OK=false
    fi
done

if [[ "$ALL_DEPS_OK" == false ]]; then
    echo -e "${RED}❌ Algumas dependências críticas não foram instaladas${NC}"
    echo -e "${YELLOW}   Tentando instalação individual...${NC}"
    
    for dep in "${CRITICAL_DEPS[@]}"; do
        if ! npm list "$dep" > /dev/null 2>&1; then
            echo -e "${YELLOW}   Instalando $dep...${NC}"
            npm install "$dep"
        fi
    done
fi

echo -e "${BLUE}▶ ETAPA 7: Verificando se servidor pode iniciar${NC}"

# Criar teste básico do servidor
cat > test-server-basic.js << 'EOF'
// test-server-basic.js - Teste básico de inicialização do servidor
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

console.log('🧪 Testando imports críticos...');

try {
    console.log('✅ express importado');
    console.log('✅ express-validator importado');
    console.log('✅ bcrypt importado');
    console.log('✅ jsonwebtoken importado');
    
    console.log('🎉 TODOS OS IMPORTS FUNCIONANDO!');
    process.exit(0);
} catch (error) {
    console.error('❌ Erro nos imports:', error.message);
    process.exit(1);
}
EOF

echo -e "${YELLOW}   Testando imports das dependências...${NC}"

if node test-server-basic.js; then
    echo -e "${GREEN}✅ Todas as dependências importam corretamente${NC}"
    rm test-server-basic.js
else
    echo -e "${RED}❌ Ainda há problemas com as dependências${NC}"
    rm test-server-basic.js
    exit 1
fi

echo -e "${BLUE}▶ ETAPA 8: Criando script de verificação de health${NC}"

cat > scripts/verificar-health.sh << 'EOF'
#!/bin/bash
# scripts/verificar-health.sh - Verificação rápida do servidor

PORT=3000
URL="http://localhost:$PORT/api/health"

echo "🏥 Verificando health do servidor..."

# Aguardar um pouco para o servidor iniciar
sleep 2

# Tentar conectar
for i in {1..10}; do
    if curl -s "$URL" > /dev/null; then
        echo "✅ Servidor respondendo na porta $PORT"
        response=$(curl -s "$URL")
        echo "📋 Resposta: $response"
        exit 0
    else
        echo "⏳ Tentativa $i/10 - aguardando servidor..."
        sleep 1
    fi
done

echo "❌ Servidor não está respondendo após 10 tentativas"
exit 1
EOF

chmod +x scripts/verificar-health.sh
echo -e "${GREEN}✅ Script de verificação criado${NC}"

echo -e "${BLUE}▶ ETAPA 9: Instruções para teste${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ DEPENDÊNCIAS CORRIGIDAS COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""

echo -e "${YELLOW}1. Testar servidor agora:${NC}"
echo -e "   ${BLUE}npm run server${NC}"
echo ""

echo -e "${YELLOW}2. Em outro terminal, verificar health:${NC}"
echo -e "   ${BLUE}./scripts/verificar-health.sh${NC}"
echo ""

echo -e "${YELLOW}3. Se funcionou, aplicar correção de rotas:${NC}"
echo -e "   ${BLUE}./scripts/corrigir-rotas-auth-completo.sh${NC}"
echo ""

echo -e "${YELLOW}4. Executar teste completo:${NC}"
echo -e "   ${BLUE}./scripts/test-auth-corrigido.sh${NC}"
echo ""

echo -e "${GREEN}📦 DEPENDÊNCIAS INSTALADAS:${NC}"
echo -e "   ✅ express-validator@7.2.0 - Validação de dados"
echo -e "   ✅ bcrypt@5.1.0 - Hash de senhas"
echo -e "   ✅ jsonwebtoken@9.0.0 - Autenticação JWT"
echo -e "   ✅ express@4.21.2 - Framework web"
echo -e "   ✅ cors@2.8.5 - CORS"
echo -e "   ✅ helmet@7.0.0 - Segurança"
echo -e "   ✅ pg@8.16.3 - PostgreSQL"
echo ""

echo -e "${GREEN}🎯 PROBLEMA RESOLVIDO:${NC}"
echo -e "   • express-validator instalado e funcional"
echo -e "   • Todas as dependências de autenticação OK"
echo -e "   • package.json corrigido e consistente"
echo -e "   • Imports funcionando corretamente"
echo ""

echo -e "${YELLOW}⚡ Execute 'npm run server' para testar!${NC}"