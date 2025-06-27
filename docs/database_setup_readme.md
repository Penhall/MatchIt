# 🗄️ Setup do Banco de Dados - MatchIt
## Configuração Completa PostgreSQL para Fase 0

---

## 🎯 **Visão Geral**

Este conjunto de scripts automatiza completamente a configuração do banco de dados PostgreSQL para o projeto MatchIt Fase 0. Os scripts são inteligentes e detectam o estado atual, executando apenas o que é necessário.

---

## 📋 **Scripts Disponíveis**

### **1. setup-database-phase0.sh** 
🎯 **Script principal** - Configura tudo do zero

**O que faz:**
- Verifica se PostgreSQL está instalado e rodando
- Cria banco `matchit_db` e usuário `matchit`
- Executa migrações essenciais para Fase 0
- Insere dados de teste
- Valida configuração completa

### **2. manage-database.sh**
🔧 **Utilitário de gestão** - Menu interativo para administração

**O que faz:**
- Verificar status do banco
- Resetar dados de teste
- Criar/restaurar backups
- Limpar banco completamente
- Interface menu amigável

### **3. check-database-ready.sh**
⚡ **Verificação rápida** - Valida se está pronto para Fase 0

**O que faz:**
- Verifica em 30 segundos se banco está OK
- Lista problemas encontrados
- Indica próximos passos

---

## 🚀 **Como Usar**

### **Setup Inicial (Primeira vez)**
```bash
# 1. Tornar scripts executáveis
chmod +x scripts/setup-database-phase0.sh
chmod +x scripts/manage-database.sh
chmod +x scripts/check-database-ready.sh

# 2. Executar setup principal
./scripts/setup-database-phase0.sh

# 3. Verificar se tudo está OK
./scripts/check-database-ready.sh
```

### **Verificação Rápida (A qualquer momento)**
```bash
# Verificar se banco está pronto
./scripts/check-database-ready.sh
```

### **Gestão e Manutenção**
```bash
# Menu interativo de administração
./scripts/manage-database.sh

# Ou comandos diretos:
./scripts/manage-database.sh status    # Ver status
./scripts/manage-database.sh backup   # Criar backup
./scripts/manage-database.sh reset    # Resetar dados teste
```

---

## ⚙️ **Configurações**

### **Credenciais do Banco:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123
```

### **Para Alterar:**
Edite as variáveis no início de cada script:
```bash
DB_HOST="seu_host"
DB_NAME="seu_banco"  
DB_USER="seu_usuario"
DB_PASSWORD="sua_senha"
```

---

## 🗄️ **Estrutura Criada**

### **Tabelas Principais:**
```sql
users                    -- Usuários do sistema
user_style_preferences   -- Preferências agregadas por categoria  
style_choices           -- Escolhas individuais para analytics
user_settings           -- Configurações do usuário
schema_migrations       -- Controle de migrações
migration_logs          -- Logs de execução
```

### **Dados de Teste:**
```
Usuário: teste@matchit.com (ID: 1)
Preferências: cores e estilos de exemplo
Escolhas: 4 exemplos de decisões
Configurações: tema claro, notificações ativadas
```

---

## 🧪 **Validação e Testes**

### **Verificação Automática:**
```bash
# Script verifica automaticamente:
✅ PostgreSQL rodando
✅ Conexão com banco
✅ Todas as tabelas existem
✅ Índices criados
✅ Dados de teste inseridos
✅ Migrações registradas
```

### **Testes Manuais:**
```bash
# Conectar ao banco
PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db

# Verificar dados
SELECT * FROM users;
SELECT * FROM user_style_preferences;
SELECT COUNT(*) FROM style_choices;

# Sair
\q
```

---

## 🔧 **Troubleshooting**

### **Problema: PostgreSQL não está rodando**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS (Homebrew)
brew services start postgresql

# Windows
# Iniciar PostgreSQL pelo Services.msc
```

### **Problema: Permissão negada**
```bash
# Se não conseguir criar usuário/banco como postgres:
sudo -u postgres psql
CREATE USER matchit WITH PASSWORD 'matchit123';
CREATE DATABASE matchit_db OWNER matchit;
GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;
\q
```

### **Problema: Banco já existe mas com problemas**
```bash
# Limpar e recriar
./scripts/manage-database.sh clean
./scripts/setup-database-phase0.sh
```

### **Problema: Scripts não executam**
```bash
# Verificar permissões
ls -la scripts/

# Tornar executáveis
chmod +x scripts/*.sh

# Verificar se está no diretório correto
pwd  # Deve mostrar o diretório raiz do projeto
ls package.json  # Deve existir
```

---

## 📊 **Status e Monitoramento**

### **Verificar Status Completo:**
```bash
./scripts/manage-database.sh status
```

**Saída esperada:**
```
✅ Conexão com banco OK
ℹ️  PostgreSQL: PostgreSQL 14.x
✅ Tabela users: 1 registros
✅ Tabela user_style_preferences: 2 registros  
✅ Tabela style_choices: 4 registros
ℹ️  Migrações executadas: 3
```

### **Logs e Debugging:**
```bash
# Ver logs do PostgreSQL (Ubuntu)
sudo tail -f /var/log/postgresql/postgresql-*.log

# Ver logs do sistema
journalctl -u postgresql -f

# Debug de conexão
PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "SELECT NOW();"
```

---

## 🔄 **Fluxo Completo Recomendado**

### **Setup Inicial:**
```bash
# 1. Verificar pré-requisitos
which psql               # PostgreSQL instalado?
pg_isready              # PostgreSQL rodando?

# 2. Executar setup
./scripts/setup-database-phase0.sh

# 3. Verificar resultado
./scripts/check-database-ready.sh

# 4. Se OK, prosseguir para Fase 0
./scripts/finalize-phase0.sh
```

### **Durante Desenvolvimento:**
```bash
# Verificação rápida diária
./scripts/check-database-ready.sh

# Reset de dados quando necessário
./scripts/manage-database.sh reset

# Backup antes de mudanças importantes  
./scripts/manage-database.sh backup
```

---

## 🎯 **Próximos Passos**

### **Após Setup Bem-sucedido:**
1. ✅ Execute: `./scripts/finalize-phase0.sh`
2. ✅ Inicie servidor: `npm run server`  
3. ✅ Execute testes: `./scripts/test-phase0-complete.sh`

### **Para Desenvolvimento:**
- Use `./scripts/manage-database.sh` para administração
- Execute `./scripts/check-database-ready.sh` antes de commits
- Faça backups regulares com `./scripts/manage-database.sh backup`

---

## 🛡️ **Backup e Recuperação**

### **Backup Automático:**
```bash
# Criar backup com timestamp
./scripts/manage-database.sh backup

# Resultado: backup_matchit_20241227_143022.sql
```

### **Restauração:**
```bash
# Menu interativo para escolher backup
./scripts/manage-database.sh restore

# Ou restauração manual
PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db < backup_file.sql
```

---

## ✅ **Checklist Final**

Antes de prosseguir para Fase 0, confirme:

- [ ] ✅ PostgreSQL instalado e rodando
- [ ] ✅ `./scripts/setup-database-phase0.sh` executado sem erros
- [ ] ✅ `./scripts/check-database-ready.sh` retorna sucesso
- [ ] ✅ Consegue conectar: `PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db`
- [ ] ✅ Dados de teste existem: `SELECT * FROM users WHERE email = 'teste@matchit.com';`
- [ ] ✅ Todas as tabelas criadas: 6 tabelas esperadas
- [ ] ✅ Migrações registradas: 3 migrações na tabela `schema_migrations`

**🎉 Se tudo estiver ✅, o banco está pronto para a Fase 0!**

---

## 📞 **Suporte**

### **Problemas Comuns:**
- **PostgreSQL não inicia**: Verificar se porta 5432 está livre
- **Permissão negada**: Executar como sudo ou verificar usuário postgres
- **Banco não conecta**: Verificar credenciais e configuração pg_hba.conf
- **Scripts falham**: Verificar permissões e diretório atual

### **Debug Avançado:**
```bash
# Verificar configuração PostgreSQL
sudo -u postgres psql -c "SHOW config_file;"

# Verificar logs detalhados
sudo tail -f /var/log/postgresql/postgresql-*.log

# Testar conexão com detalhes
PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "\conninfo"
```

**🚀 Banco pronto = Fase 0 pode começar!**