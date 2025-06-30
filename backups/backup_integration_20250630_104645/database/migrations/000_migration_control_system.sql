-- Migration Control System for MatchIt
-- Generated at: 2025-06-25T03:31:48.067Z

-- Create migration control table if not exists
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64),
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(20)
);

-- Create migration log table
CREATE TABLE IF NOT EXISTS migration_logs (
  id SERIAL PRIMARY KEY,
  migration_version VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'up', 'down', 'failed'
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER,
  error_message TEXT
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_migration_logs_version ON migration_logs(migration_version);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at);

-- Insert organized migrations into control table
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('002_emotional_profile_schema_fixed', '002_emotional_profile_schema_fixed.sql', '9675c3aa04bf50d7e0bcd40747c1626c', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('006_add_algorithm_weights', '006_add_algorithm_weights.sql', '70442b0e3a6dfe612044b7dbcb6159d6', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('20250625_007b_create_learning_sessions', '20250625_007b_create_learning_sessions.sql', 'bdf4024dfd3fa54beb4841fad692e723', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('007_add_style_data_column', '007_add_style_data_column.sql', '23137c6f64023eb8634b17d033f57b5f', 'features', 'high') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('008_add_emotional_profile_tables', '008_add_emotional_profile_tables.sql', 'ed784b0a0ab986f61815d1b4684d7534', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('009_seed_initial_data', '009_seed_initial_data.sql', 'ab3313edbd82d9515e79b9e1988c36b0', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('010_create_emotional_profile_view', '010_create_emotional_profile_view.sql', 'be35f423dd205b5f4e55b034780df760', 'migrations', 'medium') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('010_create_user_emotional_profile_view', '010_create_user_emotional_profile_view.sql', 'a71ec84ce314f818f3547e8fafe74db5', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('20250625_analyze-migrations.js', '20250625_analyze-migrations.js', '8502bcb32f5bc05c1fb7fd54afaf27e1', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('20250625_organize-migrations.js', '20250625_organize-migrations.js', '61b7af98a4bd1d6b057848f5d604e79f', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('20250625_run-migrations.js', '20250625_run-migrations.js', 'dda4af4f46511625b65ae8591069f5c3', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('003_analytics_schema', '003_analytics_schema.sql', '63fc7322b80e84d0159f27078d65168d', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('20250625_add_emotional_profile_20250624', '20250625_add_emotional_profile_20250624.sql', '6f64f89e01fa0692629b30125ecdf8bc', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_migrations (version, filename, checksum, category, priority) 
VALUES ('20250625_add_feedback_tracking_20250624', '20250625_add_feedback_tracking_20250624.sql', '1c4683e1761a391b19c2c875c3e95539', 'migrations', 'critical') 
ON CONFLICT (version) DO NOTHING;
