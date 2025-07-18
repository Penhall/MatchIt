-- database/migrations/000_migration_control.sql - Sistema de controle de migrações

BEGIN;

-- Tabela de controle de migrações
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    checksum VARCHAR(64),
    description TEXT,
    category VARCHAR(50) DEFAULT 'core',
    priority VARCHAR(20) DEFAULT 'medium'
);

-- Tabela de logs de migração
CREATE TABLE IF NOT EXISTS migration_logs (
    id SERIAL PRIMARY KEY,
    migration_version VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'up', 'down', 'failed'
    executed_at TIMESTAMP DEFAULT NOW(),
    execution_time_ms INTEGER,
    error_message TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_migration_logs_version ON migration_logs(migration_version);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at);

-- Registrar esta migração
INSERT INTO schema_migrations (version, filename, description, category, priority)
VALUES ('000', '000_migration_control.sql', 'Sistema de controle de migrações', 'core', 'critical')
ON CONFLICT (version) DO NOTHING;

COMMIT;
