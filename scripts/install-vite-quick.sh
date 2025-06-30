#!/bin/bash
# scripts/install-vite-quick.sh - Instalação rápida só do Vite

echo "⚡ INSTALAÇÃO RÁPIDA - VITE"
echo "=========================="
echo ""
echo "🎯 Problema: 'vite' não é reconhecido"
echo "✅ Solução: Instalar Vite e dependências"
echo ""

# Verificar se está no lugar certo
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório raiz do projeto"
    exit 1
fi

echo "✅ Diretório correto identificado"

# Verificar se Vite já está instalado
if npm list vite >/dev/null 2>&1; then
    echo ""
    echo "✅ Vite já está instalado!"
    echo "🔍 Verificando por que não funciona..."
    
    # Testar comando
    if npx vite --version >/dev/null 2>&1; then
        echo "✅ Comando vite funcionando"
        echo "⚠️  Problema pode ser outro"
    else
        echo "❌ Comando vite não funciona"
        echo "🔧 Reinstalando..."
        npm uninstall vite @vitejs/plugin-react
        npm install --save-dev vite @vitejs/plugin-react
    fi
else
    echo ""
    echo "📦 Instalando Vite..."
    
    # Instalar Vite e plugin React
    npm install --save-dev vite@^4.4.5 @vitejs/plugin-react@^4.0.3
    
    if [ $? -eq 0 ]; then
        echo "✅ Vite instalado com sucesso"
    else
        echo "❌ Erro na instalação do Vite"
        echo "🔧 Tentando instalação alternativa..."
        npm install --save-dev vite @vitejs/plugin-react --force
    fi
fi

# Verificar/corrigir scripts do package.json
echo ""
echo "🔧 Verificando scripts no package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Backup
if (!fs.existsSync('package.json.backup.' + Date.now())) {
    fs.writeFileSync('package.json.backup.' + Date.now(), JSON.stringify(pkg, null, 2));
}

// Garantir scripts do Vite
pkg.scripts = pkg.scripts || {};
const viteScripts = {
    'dev': 'vite',
    'build': 'vite build', 
    'preview': 'vite preview',
    'frontend': 'vite'
};

let updated = false;
Object.entries(viteScripts).forEach(([key, value]) => {
    if (!pkg.scripts[key] || !pkg.scripts[key].includes('vite')) {
        pkg.scripts[key] = value;
        updated = true;
    }
});

if (updated) {
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('✅ Scripts do Vite adicionados');
} else {
    console.log('✅ Scripts já estão corretos');
}
"

# Criar vite.config.js básico se não existir
if [ ! -f "vite.config.js" ]; then
    echo ""
    echo "🔧 Criando vite.config.js básico..."
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
EOF
    echo "✅ vite.config.js criado"
fi

# Teste final
echo ""
echo "🧪 Testando instalação..."

# Verificar se Vite está listado
if npm list vite >/dev/null 2>&1; then
    echo "✅ Vite está nas dependências"
else
    echo "❌ Vite não está nas dependências"
    exit 1
fi

# Testar comando vite
if npx vite --version >/dev/null 2>&1; then
    VITE_VERSION=$(npx vite --version 2>/dev/null)
    echo "✅ Comando 'vite' funcionando: $VITE_VERSION"
else
    echo "❌ Comando 'vite' ainda não funciona"
    echo "🔧 Verificando PATH..."
    echo "   npx deve funcionar: $(which npx || echo 'npx não encontrado')"
fi

echo ""
echo "================================================================"
echo " ✅ INSTALAÇÃO DO VITE CONCLUÍDA"
echo "================================================================"
echo ""
echo "🧪 TESTE RÁPIDO:"
echo "   npm run dev"
echo ""
echo "🎯 Se funcionar, você verá:"
echo "   'Local:   http://localhost:5173/'"
echo ""
echo "❌ Se ainda der erro, execute:"
echo "   npx vite"
echo "   (para usar diretamente)"
echo ""
echo "🔧 Ou execute a correção completa:"
echo "   ./scripts/fix-vite-and-port.sh"
echo ""
echo "✅ Vite instalado! Teste com 'npm run dev'"
