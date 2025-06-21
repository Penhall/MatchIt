const { pool } = require('../src/db');

async function testView() {
  try {
    // Verifica se a view existe
    const checkView = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'user_emotional_profile'
      )`);
    
    if (!checkView.rows[0].exists) {
      throw new Error('View user_emotional_profile não encontrada no banco de dados');
    }
    
    const result = await pool.query('SELECT * FROM user_emotional_profile LIMIT 5');
    console.log('Resultado da view user_emotional_profile:');
    console.table(result.rows);
  } catch (error) {
    console.error('Erro ao testar view:', error);
  } finally {
    await pool.end();
  }
}

testView();