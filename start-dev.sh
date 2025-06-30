#!/bin/bash
# start-dev.sh - Inicialização automática do ambiente de desenvolvimento

echo "🚀 Iniciando ambiente de desenvolvimento MatchIt..."
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🔧 Configuração:"
echo "   Backend: http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""

# Função para matar processos ao sair
cleanup() {
    echo ""
    echo "🔴 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT

# Iniciar backend
echo "🔧 Iniciando backend (porta 3001)..."
npm run server &
BACKEND_PID=$!

# Aguardar um pouco
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend (porta 5173)..."
if [ "vite" = "vite" ]; then
    npm run dev &
elif [ "vite" = "expo" ]; then
    npm start &
else
    echo "⚠️  Inicie o frontend manualmente"
fi
FRONTEND_PID=$!

echo ""
echo "✅ Serviços iniciados!"
echo "   Backend: http://localhost:3001/api/health"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait
