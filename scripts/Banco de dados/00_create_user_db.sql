-- Cria o usuário 'matchit' com a senha 'matchit123'
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'matchit') THEN
      CREATE ROLE matchit WITH LOGIN PASSWORD 'matchit123';
   END IF;
END
$do$;

-- Cria o banco de dados 'matchit_db' se não existir
SELECT 'CREATE DATABASE matchit_db WITH OWNER matchit'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'matchit_db')\gexec

-- Concede todas as permissões ao usuário 'matchit' no banco 'matchit_db'
GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;
