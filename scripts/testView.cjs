const { pool } = require('../dist/db.js');

async function testView() {
  try {
    const res = await pool.query('SELECT * FROM user_emotional_profile');
    console.log('Resultado da view:', res.rows);
  } catch (err) {
    console.error('Erro ao testar view:', err);
  } finally {
    pool.end();
  }
}

testView();