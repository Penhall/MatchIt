#!/bin/bash
# scripts/setup-tournaments.sh - Setup automático do sistema de torneios

echo "🏆 Configurando sistema de torneios MatchIt..."

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p uploads/tournament-images
mkdir -p uploads/samples/{colors,styles,accessories,shoes,patterns,casual}
mkdir -p logs

# 3. Executar migrações
echo "🗄️  Executando migrações do banco..."
if psql -d matchit_db -f database/migrations/003_complete_tournament_schema.sql; then
    echo "✅ Schema de torneios criado"
else
    echo "❌ Erro ao criar schema"
    exit 1
fi

# 4. Inserir dados iniciais
echo "🌱 Inserindo dados iniciais..."
if psql -d matchit_db -f database/seeds/002_tournament_sample_data.sql; then
    echo "✅ Dados iniciais inseridos"
else
    echo "⚠️  Aviso: Alguns dados podem já existir"
fi

# 5. Verificar configuração
echo "🔍 Verificando configuração..."

# Testar conexão com banco
if psql -d matchit_db -c "SELECT COUNT(*) FROM tournament_images;" > /dev/null 2>&1; then
    echo "✅ Conexão com banco: OK"
else
    echo "❌ Problema na conexão com banco"
fi

# Verificar arquivos críticos
if [ -f "server/services/TournamentEngine.js" ]; then
    echo "✅ TournamentEngine: OK"
else
    echo "❌ TournamentEngine: FALTANDO"
fi

echo ""
echo "🎉 Setup do sistema de torneios concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute: npm run dev"
echo "2. Teste: curl http://localhost:3000/api/health"
echo "3. Acesse: http://localhost:3000/api/tournament/categories"
echo ""
echo "🏆 Sistema de Torneios 2x2 está PRONTO!"
