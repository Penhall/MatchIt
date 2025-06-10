# scripts/run_all_migrations.py
# -*- coding: utf-8 -*-
"""
Script para executar todas as migrations do Sistema de Recomendação MatchIt
Autor: Sistema MatchIt
Data: 2025-06-07
Versão: 1.0.1 (Atualizado para usar psycopg v3)
"""

import os
import sys
import subprocess
import time
from datetime import datetime
import psycopg  # Substituído psycopg2 por psycopg v3
from psycopg import sql  # Atualizado para psycopg v3
import logging
from dotenv import load_dotenv  # Adicionado para carregar .env

# Carregar variáveis de ambiente do arquivo .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class MigrationRunner:
    def __init__(self):
        """Inicializa o runner de migrations com configurações do banco"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'user': os.getenv('DB_USER', 'postgres'),  # Valor padrão corrigido
            'password': os.getenv('DB_PASSWORD', 'abc123'),  # Valor padrão corrigido
            'dbname': os.getenv('DB_NAME', 'postgres')  # Valor padrão corrigido
        }
        self.connection = None
        
    def print_header(self):
        """Exibe o cabeçalho do sistema"""
        print("=" * 60)
        print("   MATCHIT - MIGRATIONS (psycopg v3)")
        print("=" * 60)
        
    def connect_database(self):
        """Estabelece conexão com o banco de dados usando psycopg v3"""
        try:
            logger.info("Conectando ao banco com psycopg v3...")
            self.connection = psycopg.connect(**self.db_config)
            self.connection.autocommit = True
            logger.info("✅ Conexão estabelecida com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro na conexão: {e}")
            logger.error(f"Host: {self.db_config['host']}")
            logger.error(f"Port: {self.db_config['port']}")
            logger.error(f"User: {self.db_config['user']}")
            logger.error(f"Database: {self.db_config['dbname']}")
            return False
    
    # O restante do código permanece igual (criar tabela, executar migrações, etc.)
    def create_migrations_table(self):
        """Cria a tabela de controle de migrations"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        id SERIAL PRIMARY KEY,
                        version VARCHAR(20) NOT NULL UNIQUE,
                        name VARCHAR(200) NOT NULL,
                        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        execution_time_ms INTEGER,
                        status VARCHAR(20) DEFAULT 'completed'
                    );
                """)
            logger.info("✅ Tabela de controle de migrations criada")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar tabela de controle: {e}")
            return False
    
    def migration_exists(self, version):
        """Verifica se uma migration já foi executada"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM schema_migrations WHERE version = %s",
                    (version,)
                )
                result = cursor.fetchone()[0]
                return result > 0
        except Exception as e:
            logger.error(f"❌ Erro ao verificar migration {version}: {e}")
            return False
    
    def register_migration(self, version, name, execution_time_ms):
        """Registrar uma migration como executada"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO schema_migrations (version, name, execution_time_ms) 
                    VALUES (%s, %s, %s)
                    ON CONFLICT (version) DO UPDATE SET
                        executed_at = NOW(),
                        execution_time_ms = %s,
                        status = 'completed'
                """, (version, name, execution_time_ms, execution_time_ms))
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao registrar migration {version}: {e}")
            return False
    
    def execute_sql_command(self, sql_command):
        """Executa um comando SQL"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(sql_command)
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao executar SQL: {e}")
            return False
    
    def run_migration_001(self):
        """Executa Migration 001: Tabelas Core"""
        version = "1.2.001"
        name = "Tabelas Core do Sistema de Recomendação"
        
        if self.migration_exists(version):
            logger.info("⏭️  Migration 001 já foi executada, pulando...")
            return True
        
        logger.info("📊 Executando Migration 001: Tabelas Core")
        start_time = time.time()
        
        # SQL da Migration 001 (simplificado para exemplo)
        sql_001 = """
        -- Migration 001: Tabelas Core do Sistema de Recomendação
        
        -- Extender tabela de usuários
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS extended_profile_id UUID,
        ADD COLUMN IF NOT EXISTS recommendation_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS last_recommendation_update TIMESTAMP WITH TIME ZONE;
        
        -- Tabela de perfis estendidos
        CREATE TABLE IF NOT EXISTS user_extended_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            personality_openness DECIMAL(3,2) DEFAULT 0.5,
            personality_conscientiousness DECIMAL(3,2) DEFAULT 0.5,
            personality_extraversion DECIMAL(3,2) DEFAULT 0.5,
            personality_agreeableness DECIMAL(3,2) DEFAULT 0.5,
            personality_neuroticism DECIMAL(3,2) DEFAULT 0.5,
            lifestyle_activity_level VARCHAR(20) DEFAULT 'moderate',
            lifestyle_social_preference VARCHAR(20) DEFAULT 'mixed',
            lifestyle_adventure_seeking DECIMAL(3,2) DEFAULT 0.5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- Tabela de pesos de algoritmos
        CREATE TABLE IF NOT EXISTS user_algorithm_weights (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            style_compatibility_weight DECIMAL(3,2) DEFAULT 0.30,
            location_weight DECIMAL(3,2) DEFAULT 0.25,
            personality_weight DECIMAL(3,2) DEFAULT 0.20,
            lifestyle_weight DECIMAL(3,2) DEFAULT 0.15,
            activity_weight DECIMAL(3,2) DEFAULT 0.10,
            learning_rate DECIMAL(4,3) DEFAULT 0.01,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- Tabela de interações entre usuários
        CREATE TABLE IF NOT EXISTS user_interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action VARCHAR(20) NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'view', 'skip')),
            interaction_context JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CHECK (user_id != target_user_id)
        );
        
        -- Índices básicos
        CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);
        
        SELECT 'Migration 001 executada com sucesso' as status;
        """
        
        if self.execute_sql_command(sql_001):
            end_time = time.time()
            execution_time_ms = int((end_time - start_time) * 1000)
            self.register_migration(version, name, execution_time_ms)
            logger.info("✅ Migration 001 concluída")
            return True
        else:
            logger.error("❌ Falha na Migration 001")
            return False
    
    def run_migration_002(self):
        """Executa Migration 002: Analytics"""
        version = "1.2.002"
        name = "Tabelas de Analytics e Métricas"
        
        if self.migration_exists(version):
            logger.info("⏭️  Migration 002 já foi executada, pulando...")
            return True
        
        logger.info("📈 Executando Migration 002: Analytics")
        start_time = time.time()
        
        # SQL da Migration 002 (simplificado)
        sql_002 = """
        -- Migration 002: Analytics e Métricas
        
        -- Tabela de eventos de analytics
        CREATE TABLE IF NOT EXISTS analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL,
            event_data JSONB,
            session_id VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Tabela de métricas de engajamento
        CREATE TABLE IF NOT EXISTS engagement_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            total_views INTEGER DEFAULT 0,
            total_likes INTEGER DEFAULT 0,
            total_dislikes INTEGER DEFAULT 0,
            total_matches INTEGER DEFAULT 0,
            avg_session_duration INTERVAL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, date)
        );
        
        -- Índices para analytics
        CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
        
        SELECT 'Migration 002 executada com sucesso' as status;
        """
        
        if self.execute_sql_command(sql_002):
            end_time = time.time()
            execution_time_ms = int((end_time - start_time) * 1000)
            self.register_migration(version, name, execution_time_ms)
            logger.info("✅ Migration 002 concluída")
            return True
        else:
            logger.error("❌ Falha na Migration 002")
            return False
    
    def run_all_migrations(self):
        """Executa todas as migrations em sequência"""
        self.print_header()
        
        if not self.connect_database():
            logger.error("Falha na execução das migrations")
            return False
        
        if not self.create_migrations_table():
            return False
        
        migrations = [
            self.run_migration_001,
            self.run_migration_002,
            # Adicionar mais migrations conforme necessário
        ]
        
        for migration in migrations:
            if not migration():
                logger.error("❌ Falha na execução das migrations")
                return False
        
        logger.info("🎉 TODAS AS MIGRATIONS EXECUTADAS COM SUCESSO!")
        return True
    
    def close_connection(self):
        """Fecha a conexão com o banco"""
        if self.connection:
            self.connection.close()
            logger.info("Conexão fechada")

def main():
    """Função principal"""
    runner = MigrationRunner()
    
    try:
        success = runner.run_all_migrations()
        if success:
            print("\n✅ Sistema de Recomendação MatchIt está pronto!")
            print("\n📋 Próximos passos:")
            print("1. ✅ Fase 1.1: Extensão de Tipos (Concluída)")
            print("2. ✅ Fase 1.2: Extensão do Banco (Concluída)")
            print("3. ⏳ Fase 1.3: Adaptação do Backend")
            print("4. ⏸️  Fase 2: Engine de Recomendação")
            return 0
        else:
            print("\n❌ Falha na execução das migrations")
            return 1
    except KeyboardInterrupt:
        logger.info("Execução interrompida pelo usuário")
        return 1
    except Exception as e:
        logger.error(f"Erro inesperado: {e}")
        return 1
    finally:
        runner.close_connection()

if __name__ == "__main__":
    sys.exit(main())
