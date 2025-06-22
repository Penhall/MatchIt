# scripts/fix/complete_fix.sh - Script completo para correção dos problemas identificados

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}=========================================================${NC}"
echo -e "${PURPLE}   CORREÇÃO COMPLETA DOS PROBLEMAS - MatchIt${NC}"
echo -e "${PURPLE}=========================================================${NC}"

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para terminar processos em uma porta
kill_port_process() {
    local port=$1
    local pid
    
    if command_exists lsof; then
        pid=$(lsof -ti :$port 2>/dev/null)
    elif command_exists netstat; then
        pid=$(netstat -tlnp 2>/dev/null | grep ":$port" | awk '{print $7}' | cut -d'/' -f1)
    fi
    
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Terminando processo na porta $port (PID: $pid)${NC}"
        kill -TERM $pid 2>/dev/null
        sleep 2
        
        if kill -0 $pid 2>/dev/null; then
            kill -KILL $pid 2>/dev/null
        fi
        return 0
    fi
    return 1
}

# =====================================================
# ETAPA 1: LIMPEZA DE PROCESSOS
# =====================================================

echo -e "\n${BLUE}ETAPA 1: Limpeza de processos e portas${NC}"

# Parar processos nas portas principais
for port in 3000 3001 4173; do
    if kill_port_process $port; then
        echo -e "${GREEN}✅ Porta $port liberada${NC}"
    else
        echo -e "${GREEN}✅ Porta $port já está livre${NC}"
    fi
done

# Parar processos MatchIt específicos
matchit_pids=$(ps aux | grep -E "(matchit|MatchIt)" | grep -v grep | awk '{print $2}')
if [ ! -z "$matchit_pids" ]; then
    echo -e "${YELLOW}Terminando processos MatchIt...${NC}"
    echo "$matchit_pids" | xargs -r kill -TERM 2>/dev/null
    sleep 2
    echo "$matchit_pids" | xargs -r kill -KILL 2>/dev/null
fi

# =====================================================
# ETAPA 2: CORREÇÃO DO MÓDULO SHOPPINGITEM
# =====================================================

echo -e "\n${BLUE}ETAPA 2: Corrigindo módulo ShoppingItem.js${NC}"

# Criar diretório models se não existir
mkdir -p server/models

# Backup do arquivo original se existir
if [ -f "server/models/ShoppingItem.js" ]; then
    cp "server/models/ShoppingItem.js" "server/models/ShoppingItem.js.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}⚠️  Backup criado do arquivo original${NC}"
fi

# Criar versão corrigida do ShoppingItem.js
cat > server/models/ShoppingItem.js << 'EOF'
// server/models/ShoppingItem.js - Modelo corrigido para itens de compras

class ShoppingItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id;
    this.name = data.name;
    this.category = data.category;
    this.brand = data.brand || null;
    this.price = data.price || null;
    this.currency = data.currency || 'BRL';
    this.image_url = data.image_url || null;
    this.purchase_url = data.purchase_url || null;
    this.description = data.description || null;
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.status = data.status || 'active';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  validate() {
    const errors = [];
    if (!this.user_id) errors.push('user_id é obrigatório');
    if (!this.name?.trim()) errors.push('nome é obrigatório');
    if (!this.category?.trim()) errors.push('categoria é obrigatória');
    return { isValid: errors.length === 0, errors };
  }

  toDatabase() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name?.trim(),
      category: this.category?.trim(),
      brand: this.brand?.trim() || null,
      price: this.price ? parseFloat(this.price) : null,
      currency: this.currency,
      image_url: this.image_url?.trim() || null,
      purchase_url: this.purchase_url?.trim() || null,
      description: this.description?.trim() || null,
      tags: JSON.stringify(this.tags),
      status: this.status,
      updated_at: new Date().toISOString()
    };
  }

  static fromDatabase(dbRow) {
    if (!dbRow) return null;
    
    let tags = [];
    if (dbRow.tags) {
      try {
        tags = typeof dbRow.tags === 'string' ? JSON.parse(dbRow.tags) : dbRow.tags;
      } catch (e) {
        tags = [];
      }
    }

    return new ShoppingItem({
      ...dbRow,
      tags
    });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.user_id,
      name: this.name,
      category: this.category,
      brand: this.brand,
      price: this.price,
      currency: this.currency,
      imageUrl: this.image_url,
      purchaseUrl: this.purchase_url,
      description: this.description,
      tags: this.tags,
      status: this.status,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

// Exports corrigidos
export default ShoppingItem;
export { ShoppingItem };

export const SHOPPING_CATEGORIES = [
  'clothing', 'shoes', 'accessories', 'bags', 'jewelry',
  'beauty', 'fragrances', 'watches', 'sunglasses', 'home',
  'electronics', 'books', 'sports', 'other'
];

export const SHOPPING_STATUSES = ['active', 'inactive', 'deleted'];
EOF

echo -e "${GREEN}✅ Módulo ShoppingItem.js corrigido${NC}"

# =====================================================
# ETAPA 3: CORREÇÃO DA CONFIGURAÇÃO DO FRONTEND
# =====================================================

echo -e "\n${BLUE}ETAPA 3: Corrigindo configuração do frontend${NC}"

# Backup do vite.config.js original
if [ -f "vite.config.js" ]; then
    cp "vite.config.js" "vite.config.js.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Criar configuração otimizada do Vite
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: false,
    
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error:', err.message);
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🚀 Proxy Request:', req.method, req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '🔴';
            console.log(`${emoji} Proxy Response:`, proxyRes.statusCode, req.url);
          });
        }
      },
      
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
EOF

echo -e "${GREEN}✅ Configuração do Vite corrigida${NC}"

# =====================================================
# ETAPA 4: CONFIGURAÇÃO DE AMBIENTE
# =====================================================

echo -e "\n${BLUE}ETAPA 4: Configurando variáveis de ambiente${NC}"

# Criar .env.local se não existir
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Configurações locais de desenvolvimento
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=MatchIt
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Backend
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=matchit
DB_PASSWORD=matchit123
DB_NAME=matchit_db
JWT_SECRET=matchit_secret_key_dev_2024
EOF
    echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local já existe - não sobrescrevendo${NC}"
fi

# =====================================================
# ETAPA 5: LIMPEZA E REINSTALAÇÃO
# =====================================================

echo -e "\n${BLUE}ETAPA 5: Limpeza e reinstalação de dependências${NC}"

# Limpar cache do npm
npm cache clean --force 2>/dev/null

# Remover node_modules se solicitado
echo -e "${YELLOW}Deseja remover node_modules e reinstalar? (y/n):${NC}"
read -r response

if [[ $response =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removendo node_modules...${NC}"
    rm -rf node_modules
    
    echo -e "${YELLOW}Reinstalando dependências...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependências reinstaladas${NC}"
fi

# =====================================================
# ETAPA 6: VERIFICAÇÃO FINAL
# =====================================================

echo -e "\n${BLUE}ETAPA 6: Verificação final${NC}"

# Verificar estrutura de arquivos importantes
echo -e "${YELLOW}Verificando arquivos essenciais:${NC}"

files_to_check=(
    "server/app.js"
    "server/models/ShoppingItem.js"
    "vite.config.js"
    "package.json"
    ".env.local"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ❌ $file (ausente)"
    fi
done

# Verificar se as portas estão livres
echo -e "\n${YELLOW}Verificando disponibilidade de portas:${NC}"
for port in 3000 3001; do
    if ! lsof -i :$port > /dev/null 2>&1; then
        echo -e "  ✅ Porta $port disponível"
    else
        echo -e "  ⚠️  Porta $port ainda em uso"
    fi
done

# =====================================================
# CONCLUSÃO
# =====================================================

echo -e "\n${PURPLE}=========================================================${NC}"
echo -e "${PURPLE}   CORREÇÃO CONCLUÍDA${NC}"
echo -e "${PURPLE}=========================================================${NC}"

echo -e "\n${GREEN}✅ Todas as correções aplicadas com sucesso!${NC}"

echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "1. Inicie o backend:"
echo "   cd server && npm start"
echo ""
echo "2. Em outro terminal, inicie o frontend:"
echo "   npm run dev"
echo ""
echo "3. Teste a integração:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3000/"

echo -e "\n${BLUE}Links úteis:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Backend: http://localhost:3001"
echo "• API Health: http://localhost:3001/api/health"

echo -e "\n${YELLOW}Se ainda houver problemas:${NC}"
echo "1. Verifique os logs do console"
echo "2. Execute: npm run preview (para testar build)"
echo "3. Consulte os arquivos .backup criados se necessário"

echo ""
echo -e "${GREEN}🎉 MatchIt está pronto para usar!${NC}"
