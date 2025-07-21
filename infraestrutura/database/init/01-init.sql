-- init-db.sql - Inicialização do banco MatchIt
-- Este script é executado automaticamente quando o container PostgreSQL inicia

-- Criar usuário se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'matchit') THEN
    CREATE USER matchit WITH PASSWORD 'matchit123';
  END IF;
END$$;

-- Garantir que o banco existe
CREATE DATABASE IF NOT EXISTS matchit_db;

-- Garantir permissões
GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;
GRANT ALL PRIVILEGES ON SCHEMA public TO matchit;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO matchit;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO matchit;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Confirmar inicialização
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

SELECT '✅ Banco MatchIt inicializado com sucesso\!' as status;
