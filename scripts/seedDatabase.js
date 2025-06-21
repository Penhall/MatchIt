// scripts/seedDatabase.js - Script para executar seeds manualmente
import bcrypt from 'bcryptjs';
import { pool } from '../server/config/database.js';
import { config } from '../server/config/environment.js';
import minimist from 'minimist';

// Configurações
const SEED_USERS = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    isAdmin: true,
    profile: {
      displayName: 'Administrador',
      city: 'São Paulo',
      gender: 'male',
      age: 30,
      bio: 'Usuário administrador do sistema',
      isVip: true,
      profileType: 'avançado'
    }
  },
  {
    email: 'test@example.com',
    password: 'test123',
    name: 'Test User',
    isAdmin: false,
    profile: {
      displayName: 'Usuário Teste',
      city: 'Rio de Janeiro',
      gender: 'female',
      age: 25,
      bio: 'Usuário de teste básico',
      isVip: false,
      profileType: 'básico'
    }
  }
];

const SEED_PROFILE_TYPES = [
  { type_name: 'básico', description: 'Perfil básico com funcionalidades essenciais', max_style_choices: 3, can_see_advanced_metrics: false },
  { type_name: 'intermediário', description: 'Perfil com mais opções de personalização', max_style_choices: 5, can_see_advanced_metrics: true },
  { type_name: 'avançado', description: 'Perfil completo com todas funcionalidades', max_style_choices: 10, can_see_advanced_metrics: true }
];

const SEED_SETTINGS = [
  { key: 'max_login_attempts', value: '5', description: 'Número máximo de tentativas de login' },
  { key: 'password_reset_timeout', value: '3600', description: 'Tempo em segundos para expiração do token de reset de senha' },
  { key: 'default_user_role', value: 'user', description: 'Papel padrão para novos usuários' }
];

// Dados de exemplo para sessões de aprendizado
const SEED_LEARNING_SESSIONS = [
  {
    user_email: 'admin@example.com',
    start_time: new Date(Date.now() - 86400000), // 1 dia atrás
    end_time: new Date(Date.now() - 82800000), // 1 hora depois
    activity_type: 'lesson',
    duration_minutes: 60
  },
  {
    user_email: 'test@example.com',
    start_time: new Date(Date.now() - 172800000), // 2 dias atrás
    end_time: new Date(Date.now() - 169200000), // 1 hora depois
    activity_type: 'quiz',
    duration_minutes: 45
  }
];

// Dados de exemplo para estados emocionais (modelo VAD)
const SEED_EMOTIONAL_STATES = [
  {
    session_user_email: 'admin@example.com',
    valence: 0.8,
    arousal: 0.6,
    dominance: 0.7,
    timestamp: new Date(Date.now() - 86400000) // 1 dia atrás
  },
  {
    session_user_email: 'test@example.com',
    valence: 0.5,
    arousal: 0.4,
    dominance: 0.5,
    timestamp: new Date(Date.now() - 172800000) // 2 dias atrás
  }
];

async function seedDatabase(force = false) {
  // Verifica ambiente
  if (!force && process.env.NODE_ENV !== 'development') {
    console.log('⚠️ Seeds só podem ser executados em ambiente de desenvolvimento');
    console.log('Use --force para ignorar esta verificação');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Configura força se necessário
    if (force) {
      await client.query("SET matchit.force_seeds = 'true'");
    }

    // Inserir tipos de perfil
    for (const profileType of SEED_PROFILE_TYPES) {
      await client.query(
        `INSERT INTO user_profile_types
         (type_name, description, max_style_choices, can_see_advanced_metrics)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (type_name) DO NOTHING`,
        [
          profileType.type_name,
          profileType.description,
          profileType.max_style_choices,
          profileType.can_see_advanced_metrics
        ]
      );
    }

    // Inserir usuários
    for (const user of SEED_USERS) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      // Inserir usuário
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, name, is_active, is_admin)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [user.email, hashedPassword, user.name, true, user.isAdmin]
      );

      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        
        // Inserir perfil
        await client.query(
          `INSERT INTO user_profiles
           (user_id, display_name, avatar_url, style_data, profile_type)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id) DO NOTHING`,
          [
            userId,
            user.profile.displayName,
            null,
            JSON.stringify({
              city: user.profile.city,
              gender: user.profile.gender,
              age: user.profile.age,
              style_completion_percentage: user.isAdmin ? 100 : 50,
              bio: user.profile.bio,
              is_vip: user.profile.isVip
            }),
            user.profile.profileType
          ]
        );
      }
    }

    // Inserir configurações
    for (const setting of SEED_SETTINGS) {
      await client.query(
        `INSERT INTO system_settings (setting_key, setting_value, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (setting_key) DO NOTHING`,
        [setting.key, setting.value, setting.description]
      );
    }

    // Inserir sessões de aprendizado
    for (const session of SEED_LEARNING_SESSIONS) {
      const userRes = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [session.user_email]
      );
      
      if (userRes.rows.length > 0) {
        await client.query(
          `INSERT INTO learning_sessions
           (user_id, start_time, end_time, activity_type, duration_minutes)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userRes.rows[0].id,
            session.start_time,
            session.end_time,
            session.activity_type,
            session.duration_minutes
          ]
        );
      }
    }

    // Inserir estados emocionais
    for (const state of SEED_EMOTIONAL_STATES) {
      const userRes = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [state.session_user_email]
      );
      
      if (userRes.rows.length > 0) {
        const sessionRes = await client.query(
          `SELECT id FROM learning_sessions
           WHERE user_id = $1
           ORDER BY start_time DESC LIMIT 1`,
          [userRes.rows[0].id]
        );
        
        if (sessionRes.rows.length > 0) {
          await client.query(
            `INSERT INTO emotional_states
             (user_id, session_id, valence, arousal, dominance, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              userRes.rows[0].id,
              sessionRes.rows[0].id,
              state.valence,
              state.arousal,
              state.dominance,
              state.timestamp
            ]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seeds aplicados com sucesso');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao aplicar seeds:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const force = args.force || false;

  try {
    console.log('🚀 Iniciando seed do banco de dados...');
    await seedDatabase(force);
    console.log('✨ Seed concluído com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('💥 Falha ao executar seed:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}