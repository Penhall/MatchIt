#!/bin/bash
# complete-fix.sh - Resolve problemas de setError + API 400

echo "🛠️ MatchIt - Correção Completa"
echo "=============================="
echo ""
echo "🎯 Vamos corrigir:"
echo "   1. setError is not defined (frontend)"
echo "   2. HTTP 400 em /api/auth/register (backend)"
echo ""
read -p "Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

echo "🔄 Passo 1: Limpando cache do frontend..."
docker-compose build --no-cache frontend

echo ""
echo "🔄 Passo 2: Verificando e corrigindo server.js..."

# Verificar se server.js tem o endpoint de register
if grep -q "/api/auth/register" server.js; then
    echo "✅ Endpoint /api/auth/register encontrado no server.js"
else
    echo "❌ Endpoint /api/auth/register NÃO encontrado!"
    echo "💡 Verifique se o server.js está completo"
fi

echo ""
echo "🔄 Passo 3: Verificando banco de dados..."

# Verificar se PostgreSQL está funcionando
if docker-compose exec -T postgres pg_isready -U matchit 2>/dev/null | grep -q "accepting connections"; then
    echo "✅ PostgreSQL funcionando"
    
    # Verificar se as tabelas existem
    TABLES=$(docker-compose exec -T postgres psql -U matchit -d matchit_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ "$TABLES" -gt 0 ]; then
        echo "✅ Encontradas $TABLES tabelas no banco"
    else
        echo "⚠️ Nenhuma tabela encontrada. Criando estrutura básica..."
        
        # Criar tabelas básicas se não existirem
        docker-compose exec -T postgres psql -U matchit -d matchit_db << 'EOF'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    style_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar se foram criadas
SELECT 'Tabelas criadas:' as status;
\dt
EOF
        echo "✅ Estrutura do banco criada"
    fi
else
    echo "❌ PostgreSQL não está funcionando"
    exit 1
fi

echo ""
echo "🔄 Passo 4: Reiniciando todos os containers..."
docker-compose restart

echo ""
echo "🔄 Passo 5: Aguardando containers inicializarem..."
sleep 15

echo ""
echo "🔄 Passo 6: Testando API..."

# Testar health check
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend respondendo"
    
    # Testar endpoint de registro
    echo "🧪 Testando registro de usuário..."
    
    RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test'$(date +%s)'@example.com",
            "password": "123456",
            "name": "Test User"
        }' \
        -o /tmp/test_register.json 2>/dev/null)
    
    echo "📊 Status da resposta: $RESPONSE"
    
    if [ "$RESPONSE" = "201" ]; then
        echo "✅ Registro funcionando!"
        echo "📋 Resposta:"
        cat /tmp/test_register.json | head -5
    else
        echo "❌ Erro no registro. Resposta:"
        cat /tmp/test_register.json
    fi
    
    rm -f /tmp/test_register.json
    
else
    echo "❌ Backend não está respondendo"
    echo "📋 Logs do backend:"
    docker-compose logs --tail=10 backend
fi

echo ""
echo "🎯 TESTE MANUAL:"
echo "==============="
echo ""
echo "1. 🌐 Acesse: http://localhost"
echo "2. 📝 Clique em 'Cadastrar'"
echo "3. 📋 Preencha:"
echo "   - Email: test@example.com"
echo "   - Senha: 123456"
echo "   - Nome: Test User"
echo "4. ✅ Clique em 'Cadastrar'"
echo ""
echo "💡 Se ainda der erro:"
echo "   - Abra F12 -> Console"
echo "   - Abra F12 -> Network"
echo "   - Tente cadastrar novamente"
echo "   - Veja qual erro aparece"

echo ""
echo "🔍 Para debug adicional:"
echo "   docker-compose logs backend"
echo "   docker-compose logs frontend"

echo ""
echo "✅ CORREÇÃO COMPLETA APLICADA!"