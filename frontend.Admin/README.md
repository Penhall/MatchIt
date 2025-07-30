# MatchIt Admin Dashboard

Dashboard administrativo para gerenciamento do sistema de torneios de imagens do MatchIt, desenvolvido com Streamlit.

## 📋 Visão Geral

O MatchIt Admin Dashboard é uma interface web completa que permite aos administradores gerenciar imagens, categorias, usuários e monitorar analytics do sistema de torneios. Oferece funcionalidades CRUD completas, relatórios avançados e configurações de sistema.

### 🎯 Funcionalidades Principais

- **📊 Dashboard**: Visão geral com métricas e estatísticas
- **🖼️ Gerenciamento de Imagens**: Upload, aprovação, edição e remoção de imagens
- **📂 Gestão de Categorias**: Organização e análise por categorias
- **📈 Analytics Avançados**: Relatórios detalhados e visualizações
- **⚙️ Configurações**: Administração do sistema e segurança
- **🔐 Autenticação**: Sistema seguro de login administrativo

## 🚀 Instalação e Configuração

### Pré-requisitos

- Python 3.9+
- PostgreSQL 13+
- Docker (opcional, mas recomendado)

### Instalação Local

1. **Clone e acesse o diretório**:
```bash
cd frontend.Admin/streamlit
```

2. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

3. **Configure as variáveis de ambiente**:
```bash
# Crie um arquivo .env na raiz do projeto
cp .env.example .env
```

4. **Configure o banco de dados no .env**:
```env
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=admin
DB_PASSWORD=sua_senha_aqui

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha_admin
SECRET_KEY=sua_chave_secreta_32_caracteres

# Upload
UPLOAD_PATH=../../uploads/tournament-images/
MAX_FILE_SIZE_MB=5
ALLOWED_FORMATS=jpg,jpeg,png,webp
```

5. **Execute a aplicação**:
```bash
streamlit run app.py
```

A aplicação estará disponível em `http://localhost:8501`

### Instalação com Docker (Recomendado)

**Os arquivos Docker foram movidos para `../infraestrutura/` para centralizar toda a configuração de containers.**

1. **Build e execute usando scripts da infraestrutura**:
```bash
# Dashboard standalone
cd ../infraestrutura
./start-admin.sh standalone

# Admin + stack completo
./start-admin.sh full

# Ver logs
./start-admin.sh logs
```

2. **Ou use docker-compose diretamente**:
```bash
cd ../infraestrutura
docker-compose --profile admin up --build
```

## 🏗️ Estrutura do Projeto

```
frontend.Admin/
├── streamlit/
│   ├── app.py                    # Aplicação principal
│   ├── config.py                 # Configurações centralizadas
│   ├── requirements.txt          # Dependências Python
│   │
│   ├── pages/                    # Páginas da aplicação
│   │   ├── 01_📊_Dashboard.py    # Dashboard principal
│   │   ├── 02_🖼️_Gerenciar_Imagens.py  # CRUD de imagens
│   │   ├── 03_📂_Categorias.py   # Gestão de categorias
│   │   ├── 04_📈_Analytics.py    # Analytics avançados
│   │   └── 05_⚙️_Configurações.py # Configurações
│   │
│   ├── utils/                    # Utilitários
│   │   ├── database.py           # Gerenciador de BD
│   │   ├── auth.py              # Autenticação
│   │   ├── image_handler.py     # Processamento de imagens
│   │   └── helpers.py           # Funções auxiliares
│   │
│   └── static/
│       └── style.css            # Estilos customizados
│
# Docker configs moved to ../infraestrutura/
│
└── README.md                    # Este arquivo
```

## 🔐 Autenticação e Segurança

### Credenciais Padrão

**⚠️ IMPORTANTE**: Altere as credenciais padrão antes de usar em produção!

- **Usuário**: `admin`
- **Senha**: `matchit_admin_2025`

### Configurações de Segurança

- Sessões com timeout configurável (padrão: 2 horas)
- Senhas criptografadas com bcrypt
- Proteção contra ataques de força bruta
- Validação de entrada e sanitização

### Alterando Credenciais

1. **Via variáveis de ambiente** (recomendado):
```env
ADMIN_USERNAME=seu_usuario
ADMIN_PASSWORD=sua_senha_forte
SECRET_KEY=chave_secreta_minimo_32_caracteres
```

2. **Via interface** (após login):
   - Acesse `⚙️ Configurações > 🔐 Segurança`
   - Use o formulário "Alterar Senha"

## 📊 Funcionalidades Detalhadas

### Dashboard Principal
- Métricas em tempo real (total de imagens, aprovações, pendências)
- Gráficos de distribuição por status e categoria
- Timeline de uploads recentes
- Ações rápidas para navegação

### Gerenciamento de Imagens
- **Upload**: Drag-and-drop múltiplo com validação
- **Visualização**: Grid e lista com filtros avançados
- **Edição**: Metadados, categorias, status
- **Aprovação**: Em lote ou individual
- **Processamento**: Redimensionamento automático e thumbnails

### Analytics
- Filtros por período, categoria e status
- Gráficos interativos (Plotly)
- Relatórios de performance por categoria
- Insights automáticos
- Exportação de dados (CSV)

### Configurações
- Segurança e autenticação
- Gerenciamento de categorias
- Configurações de upload
- Manutenção do sistema
- Informações e logs

## 🛠️ Configuração Avançada

### Personalização de Estilos

Edite `static/style.css` para personalizar a aparência:

```css
:root {
    --primary-color: #007bff;  /* Cor principal */
    --success-color: #28a745;  /* Cor de sucesso */
    /* ... outras variáveis */
}
```

### Configurações de Upload

No arquivo `config.py` ou via variáveis de ambiente:

```python
UPLOAD_CONFIG = {
    'MAX_FILE_SIZE_MB': 5,           # Tamanho máximo
    'ALLOWED_FORMATS': ['jpg', 'png', 'webp'],
    'AUTO_RESIZE': True,             # Redimensionar automaticamente
    'MAX_WIDTH': 1920,               # Largura máxima
    'MAX_HEIGHT': 1080,              # Altura máxima
    'GENERATE_THUMBNAILS': True,     # Gerar miniaturas
    'THUMBNAIL_SIZE': 150            # Tamanho da miniatura
}
```

### Configurações de Banco

```python
DATABASE_CONFIG = {
    'HOST': 'localhost',
    'PORT': 5432,
    'DATABASE': 'matchit_db',
    'USER': 'admin',
    'PASSWORD': 'senha',
    'MAX_CONNECTIONS': 20,
    'CONNECTION_TIMEOUT': 30
}
```

## 🐳 Deploy com Docker

### Ambiente de Desenvolvimento

```bash
# Build e execução
docker-compose -f docker/docker-compose.admin.yml up --build

# Apenas rebuild da aplicação
docker-compose -f docker/docker-compose.admin.yml up --build matchit-admin

# Logs em tempo real
docker-compose -f docker/docker-compose.admin.yml logs -f matchit-admin
```

### Ambiente de Produção

1. **Crie um arquivo docker-compose.prod.yml**:
```yaml
version: '3.8'
services:
  matchit-admin:
    environment:
      - LOG_LEVEL=WARNING
      - SESSION_TIMEOUT=3600
    restart: always
```

2. **Execute com configurações de produção**:
```bash
docker-compose -f docker/docker-compose.admin.yml -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente para Docker

Crie um arquivo `.env` na pasta `docker/`:

```env
# Banco de dados
DB_HOST=postgres
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=admin
DB_PASSWORD=senha_forte_aqui
DB_EXTERNAL_PORT=5433

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha_admin_muito_forte
SECRET_KEY=chave-super-secreta-minimo-32-caracteres
SESSION_TIMEOUT=7200

# Upload
UPLOAD_VOLUME=../../uploads
MAX_FILE_SIZE_MB=10
ALLOWED_FORMATS=jpg,jpeg,png,webp

# Redis (opcional)
REDIS_PASSWORD=redis_senha_forte

# Logs
LOG_LEVEL=INFO
```

## 🔧 Manutenção e Troubleshooting

### Logs

```bash
# Logs da aplicação
docker-compose -f docker/docker-compose.admin.yml logs matchit-admin

# Logs do banco
docker-compose -f docker/docker-compose.admin.yml logs postgres

# Logs em tempo real
docker-compose -f docker/docker-compose.admin.yml logs -f
```

### Comandos Úteis

```bash
# Verificar status dos containers
docker-compose -f docker/docker-compose.admin.yml ps

# Reiniciar apenas o admin
docker-compose -f docker/docker-compose.admin.yml restart matchit-admin

# Backup do banco
docker exec matchit-postgres-admin pg_dump -U admin matchit_db > backup.sql

# Restaurar backup
docker exec -i matchit-postgres-admin psql -U admin matchit_db < backup.sql

# Limpar volumes (⚠️ apaga dados!)
docker-compose -f docker/docker-compose.admin.yml down -v
```

### Problemas Comuns

1. **Erro de conexão com banco**:
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no `.env`
   - Teste a conectividade: `docker exec -it matchit-postgres-admin psql -U admin matchit_db`

2. **Erro de permissão de upload**:
   - Verifique as permissões da pasta uploads
   - Confirme o caminho no `UPLOAD_PATH`

3. **Aplicação não carrega**:
   - Verifique os logs: `docker-compose logs matchit-admin`
   - Confirme se a porta 8501 está livre
   - Teste o healthcheck: `curl http://localhost:8501/_stcore/health`

## 🚦 Monitoramento

### Health Checks

- **Aplicação**: `http://localhost:8501/_stcore/health`
- **Banco**: Verificação automática via Docker
- **Logs**: Monitoramento via container logs

### Métricas

A aplicação expõe métricas básicas através da interface web:
- Total de imagens por status
- Taxa de aprovação
- Uploads por período
- Performance por categoria

## 📝 Contribuição

### Desenvolvimento Local

1. **Configure o ambiente**:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

2. **Execute em modo desenvolvimento**:
```bash
streamlit run app.py --logger.level=debug
```

3. **Execute testes** (quando disponíveis):
```bash
pytest tests/
```

### Estrutura de Commits

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes

## 📄 Licença

Este projeto é parte do MatchIt e segue a mesma licença do projeto principal.

## 🆘 Suporte

Para suporte ou dúvidas:

- 📧 **Email**: admin@matchit.app
- 🌐 **Documentação**: `/docs/admin`
- 🐛 **Issues**: `/issues`
- 💬 **Discord**: [Link do servidor]

---

**MatchIt Admin Dashboard v1.0.0**  
Desenvolvido com ❤️ pela equipe MatchIt