#!/bin/bash
# scripts/instalar-express-validator.sh - Correção rápida para instalar express-validator

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 INSTALAÇÃO RÁPIDA: express-validator${NC}"
echo ""

echo -e "${YELLOW}🔧 Instalando express-validator...${NC}"

if npm install express-validator; then
    echo -e "${GREEN}✅ express-validator instalado com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Agora você pode iniciar o servidor:${NC}"
    echo -e "   ${BLUE}npm run server${NC}"
    echo ""
    echo -e "${YELLOW}📋 Versão instalada:${NC}"
    npm list express-validator 2>/dev/null | grep express-validator || echo "   express-validator instalado"
else
    echo -e "${RED}❌ Falha na instalação${NC}"
    echo -e "${YELLOW}   Use o script completo: ./scripts/corrigir-dependencias-completo.sh${NC}"
    exit 1
fi