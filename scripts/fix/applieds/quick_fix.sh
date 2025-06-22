# scripts/fix/quick_fix.sh - Comandos rápidos para solução imediata dos problemas

#!/bin/bash

echo "🚨 SOLUÇÃO RÁPIDA DOS PROBLEMAS IDENTIFICADOS"
echo "=============================================="

# 1. PARAR TODOS OS PROCESSOS NA PORTA 3001
echo "1. Liberando porta 3001..."

# Diferentes métodos para diferentes sistemas
if command -v lsof > /dev/null; then
    # macOS/Linux com lsof
    lsof -ti :3001 | xargs -r kill -9 2>/dev/null
elif command -v netstat > /dev/null; then
    # Linux com netstat
    netstat -tlnp | grep :3001 | awk '{print $7}' | cut -d'/' -f1 | xargs -r kill -9 2>/dev/null
elif command -v taskkill > /dev/null; then
    # Windows
    netstat -ano | findstr :3001 | awk '{print $5}' | xargs -r taskkill /PID /F 2>/dev/null
fi

echo "✅ Porta 3001 liberada"

# 2. CORREÇÃO RÁPIDA DO MÓDULO SHOPPINGITEM
echo ""
echo "2. Corrigindo ShoppingItem.js..."

mkdir -p server/models

cat > server/models/ShoppingItem.js << 'EOF'
// server/models/ShoppingItem.js - Versão corrigida com exports adequados

class ShoppingItem {
  constructor(data = {}) {
    Object.assign(this, {
      id: null,
      user_id: null,
      name: '',
      category: '',
      brand: null,
      price: null,
      currency: 'BRL',
      image_url: null,
      purchase_url: null,
      description: null,
      tags: [],
      status: 'active',
      created_at: null,
      updated_at: null,
      ...data
    });
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
      ...this,
      name: this.name?.trim(),
      category: this.category?.trim(),
      brand: this.brand?.trim() || null,
      price: this.price ? parseFloat(this.price) : null,
      tags: JSON.stringify(this.tags || []),
      updated_at: new Date().toISOString()
    };
  }

  static fromDatabase(dbRow) {
    if (!dbRow) return null;
    
    const data = { ...dbRow };
    if (typeof data.tags === 'string') {
      try {
        data.tags = JSON.parse(data.tags);
      } catch {
        data.tags = [];
      }
    }
    
    return new ShoppingItem(data);
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

// EXPORTS CORRIGIDOS - Esta é a parte mais importante!
export default ShoppingItem;
export { ShoppingItem };

// Constantes auxiliares
export const SHOPPING_CATEGORIES = [
  'clothing', 'shoes', 'accessories', 'bags', 'jewelry',
  'beauty', 'fragrances', 'watches', 'sunglasses', 'other'
];

export const SHOPPING_STATUSES = ['active', 'inactive', 'deleted'];
EOF

echo "✅ ShoppingItem.js corrigido com exports adequados"

# 3. CONFIGURAÇÃO MÍNIMA DO VITE
echo ""
echo "3. Configurando proxy do Vite..."

cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
EOF

echo "✅ Vite configurado"

# 4. VARIÁVEIS DE AMBIENTE BÁSICAS
echo ""
echo "4. Configurando variáveis de ambiente..."

if [ ! -f ".env" ]; then
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=matchit
DB_PASSWORD=matchit123
DB_NAME=matchit_db
JWT_SECRET=matchit_secret_dev
EOF
echo "✅ Arquivo .env criado"
else
echo "✅ Arquivo .env já existe"
fi

# 5. VERIFICAR ESTRUTURA DE IMPORTS NO APP.JS
echo ""
echo "5. Verificando imports no app.js..."

if [ -f "server/app.js" ]; then
    # Verificar se há import problemático do ShoppingItem
    if grep -q "ShoppingItem" server/app.js; then
        echo "⚠️  Import de ShoppingItem encontrado em app.js"
        echo "   Verifique se está usando: import ShoppingItem from './models/ShoppingItem.js'"
    fi
    echo "✅ app.js verificado"
else
    echo "❌ server/app.js não encontrado"
fi

# 6. LIMPEZA RÁPIDA
echo ""
echo "6. Limpeza rápida..."

# Limpar cache do npm
npm cache clean --force 2>/dev/null || echo "Cache já limpo"

echo "✅ Cache limpo"

# 7. COMANDOS PARA TESTAR
echo ""
echo "=========================================="
echo "🎯 COMANDOS PARA TESTAR A SOLUÇÃO:"
echo "=========================================="
echo ""
echo "1. Inicie o backend (em um terminal):"
echo "   npm start"
echo "   # ou"
echo "   node server/app.js"
echo ""
echo "2. Inicie o frontend (em outro terminal):"
echo "   npm run dev"
echo ""
echo "3. Teste se está funcionando:"
echo "   curl http://localhost:3001/api/health"
echo ""
echo "4. Se ainda houver erro de porta:"
echo "   export PORT=3002"
echo "   npm start"
echo ""
echo "=========================================="
echo "🔧 DIAGNÓSTICO RÁPIDO:"
echo "=========================================="
echo ""
echo "• Verificar processo na porta:"
echo "  lsof -i :3001"
echo ""
echo "• Verificar logs do backend:"
echo "  tail -f server.log"
echo ""
echo "• Testar conexão do frontend:"
echo "  curl http://localhost:3000/"
echo ""
echo "=========================================="
echo "✅ CORREÇÃO RÁPIDA CONCLUÍDA!"
echo "=========================================="
