# scripts/setup_database.py
import os
import sys
import psycopg
import logging
from dotenv import load_dotenv

# Carregar variáveis de ambiente
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def create_database():
    """Cria usuário e banco de dados se não existirem"""
    admin_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'user': 'postgres',
        'password': 'abc123',  # Senha padrão do PostgreSQL
        'dbname': 'postgres'
    }
    
    try:
        logger.info("Conectando como superusuário para criar banco...")
        with psycopg.connect(**admin_config) as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                # Criar usuário se não existir
                cur.execute("""
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'matchit') THEN
                            CREATE USER matchit WITH PASSWORD 'matchit123';
                        END IF;
                    END $$;
                """)
                
                # Verificar e criar banco de dados se não existir
                cur.execute("SELECT 1 FROM pg_database WHERE datname = 'matchit_db'")
                exists = cur.fetchone()
                
                if not exists:
                    cur.execute("""
                        CREATE DATABASE matchit_db 
                        WITH OWNER = matchit 
                        ENCODING = 'UTF8';
                    """)
                    logger.info("✅ Banco de dados criado com sucesso")
                else:
                    logger.info("⏭️  Banco de dados já existe, pulando criação")
                
                logger.info("✅ Setup do usuário e banco concluído")
                return True
    except Exception as e:
        logger.error(f"❌ Erro ao criar banco de dados: {e}")
        return False

def run_init_script():
    """Executa o script de inicialização do banco de dados"""
    try:
        user_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'user': 'matchit',
            'password': 'matchit123',
            'dbname': 'matchit_db'
        }
        
        logger.info("Conectando ao matchit_db para criar tabelas básicas...")
        with psycopg.connect(**user_config) as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                # Executar script SQL
                init_script_path = os.path.join(os.path.dirname(__file__), 'Banco de dados', 'init_db.sql')
                with open(init_script_path, 'r', encoding='utf-8') as f:
                    sql_script = f.read()
                    cur.execute(sql_script)
                
                logger.info("✅ Tabelas básicas criadas com sucesso")
                return True
    except Exception as e:
        logger.error(f"❌ Erro ao executar script de inicialização: {e}")
        return False

def main():
    print("=" * 60)
    print("   MATCHIT - SETUP DO BANCO DE DADOS")
    print("=" * 60)
    
    if not create_database():
        return 1
        
    if not run_init_script():
        return 1
        
    print("\n✅ Setup do banco concluído! Agora execute as migrações.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
