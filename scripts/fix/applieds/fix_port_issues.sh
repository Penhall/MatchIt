# scripts/fix/fix_port_issues.sh - Correção de problemas de porta e processos

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   CORREÇÃO DE PROBLEMAS DE PORTA - MatchIt${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Verificar qual processo está usando a porta 3001
echo -e "\n${YELLOW}1. Verificando processos na porta 3001...${NC}"

# Diferentes comandos para diferentes sistemas
if command -v lsof > /dev/null; then
    port_process=$(lsof -i :3001 -t 2>/dev/null)
elif command -v netstat > /dev/null; then
    port_process=$(netstat -tlnp 2>/dev/null | grep ":3001" | awk '{print $7}' | cut -d'/' -f1)
elif command -v ss > /dev/null; then
    port_process=$(ss -tlnp 2>/dev/null | grep ":3001" | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2)
fi

if [ ! -z "$port_process" ]; then
    echo -e "${RED}⚠️  Processo encontrado na porta 3001: PID $port_process${NC}"
    
    # Mostrar detalhes do processo
    if command -v ps > /dev/null; then
        echo -e "${YELLOW}Detalhes do processo:${NC}"
        ps -p $port_process -o pid,ppid,cmd 2>/dev/null || echo "Não foi possível obter detalhes"
    fi
    
    # Perguntar se deve terminar o processo
    echo -e "\n${YELLOW}Deseja terminar este processo? (y/n):${NC}"
    read -r response
    
    if [[ $response =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Terminando processo $port_process...${NC}"
        kill -TERM $port_process 2>/dev/null
        sleep 2
        
        # Verificar se ainda está rodando
        if kill -0 $port_process 2>/dev/null; then
            echo -e "${RED}Processo ainda rodando. Forçando término...${NC}"
            kill -KILL $port_process 2>/dev/null
        fi
        
        echo -e "${GREEN}✅ Processo terminado${NC}"
    else
        echo -e "${YELLOW}⚠️  Processo mantido. Você pode usar uma porta diferente${NC}"
    fi
else
    echo -e "${GREEN}✅ Porta 3001 está livre${NC}"
fi

# 2. Verificar outros processos Node.js relacionados ao MatchIt
echo -e "\n${YELLOW}2. Verificando outros processos MatchIt...${NC}"

matchit_processes=$(ps aux | grep -E "(matchit|MatchIt)" | grep -v grep | awk '{print $2}')

if [ ! -z "$matchit_processes" ]; then
    echo -e "${YELLOW}Processos MatchIt encontrados:${NC}"
    ps aux | grep -E "(matchit|MatchIt)" | grep -v grep
    
    echo -e "\n${YELLOW}Deseja terminar todos os processos MatchIt? (y/n):${NC}"
    read -r response
    
    if [[ $response =~ ^[Yy]$ ]]; then
        echo "$matchit_processes" | while read -r pid; do
            if [ ! -z "$pid" ]; then
                echo -e "${YELLOW}Terminando processo $pid...${NC}"
                kill -TERM "$pid" 2>/dev/null
            fi
        done
        sleep 2
        echo -e "${GREEN}✅ Processos MatchIt terminados${NC}"
    fi
else
    echo -e "${GREEN}✅ Nenhum processo MatchIt ativo${NC}"
fi

# 3. Limpar cache do npm se necessário
echo -e "\n${YELLOW}3. Limpando cache do npm...${NC}"
npm cache clean --force 2>/dev/null || echo "Cache do npm já limpo"

# 4. Verificar configuração de porta no projeto
echo -e "\n${YELLOW}4. Verificando configuração de porta...${NC}"

# Verificar package.json
if [ -f "package.json" ]; then
    echo -e "${BLUE}package.json encontrado${NC}"
    
    # Verificar scripts
    echo -e "${YELLOW}Scripts configurados:${NC}"
    cat package.json | grep -A 10 '"scripts"' | head -12
fi

# Verificar .env
if [ -f ".env" ]; then
    echo -e "\n${BLUE}.env encontrado${NC}"
    echo -e "${YELLOW}Configurações de porta:${NC}"
    grep -i port .env || echo "Nenhuma configuração de porta encontrada"
fi

# Verificar vite.config.js
if [ -f "vite.config.js" ]; then
    echo -e "\n${BLUE}vite.config.js encontrado${NC}"
    echo -e "${YELLOW}Configuração do Vite:${NC}"
    cat vite.config.js | grep -A 5 -B 5 "port\|proxy" || echo "Configuração de porta não encontrada"
fi

# 5. Sugerir portas alternativas
echo -e "\n${YELLOW}5. Verificando portas alternativas disponíveis...${NC}"

ports_to_check=(3002 3003 3004 3005 8000 8001)
available_ports=()

for port in "${ports_to_check[@]}"; do
    if ! lsof -i :$port > /dev/null 2>&1; then
        available_ports+=($port)
    fi
done

if [ ${#available_ports[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Portas disponíveis: ${available_ports[*]}${NC}"
    echo -e "${YELLOW}Para usar uma porta diferente:${NC}"
    echo "  export PORT=${available_ports[0]}"
    echo "  npm start"
else
    echo -e "${RED}⚠️  Nenhuma porta comum disponível${NC}"
fi

# 6. Configuração de proxy para o frontend
echo -e "\n${YELLOW}6. Gerando configuração de proxy atualizada...${NC}"

cat > vite.config.js.suggested << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
EOF

echo -e "${GREEN}✅ Configuração de proxy salva em vite.config.js.suggested${NC}"

echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${BLUE}   RESUMO DAS AÇÕES${NC}"
echo -e "${BLUE}=====================================================${NC}"

echo -e "\n${GREEN}✅ Verificação de porta concluída${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Reinicie o backend: npm start (ou com porta alternativa)"
echo "2. Reinicie o frontend: npm run dev"
echo "3. Use a configuração de proxy sugerida se necessário"
echo ""
echo -e "${BLUE}Para verificar se tudo está funcionando:${NC}"
echo "  curl http://localhost:3001/api/health  # Backend"
echo "  curl http://localhost:3000/           # Frontend"
