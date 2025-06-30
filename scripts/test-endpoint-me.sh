#!/bin/bash
# scripts/test-endpoint-me.sh - Teste específico para endpoint /me

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3000/api"
TEST_EMAIL="test_me_$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Teste Endpoint ME"

echo -e "${BLUE}🧪 TESTE ESPECÍFICO: Endpoint /me${NC}"
echo ""

# 1. Registrar usuário
echo -e "${YELLOW}1. Registrando usuário...${NC}"
REGISTER_DATA=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "name": "$TEST_NAME"
}
