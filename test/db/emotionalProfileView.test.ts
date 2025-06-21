import { pool } from '../../src/db';
import { describe, beforeAll, afterAll, test, expect } from 'vitest';

describe('user_emotional_profile view', () => {
  beforeAll(async () => {
    // Inserir dados de teste
    await pool.query(`
      INSERT INTO emotional_states 
        (user_id, valence, arousal, dominance, timestamp, source)
      VALUES
        (1, 0.5, 0.7, 0.6, NOW() - INTERVAL '1 hour', 'self_report'),
        (1, -0.2, 0.9, 0.3, NOW() - INTERVAL '2 hours', 'self_report'),
        (1, 0.8, 0.5, 0.7, NOW() - INTERVAL '1 day', 'self_report'),
        (2, 0.1, 0.6, 0.5, NOW() - INTERVAL '1 week', 'biometric'),
        (2, -0.5, 0.8, 0.4, NOW() - INTERVAL '2 weeks', 'biometric')
    `);
  });

  test('should return aggregated data by hour', async () => {
    const result = await pool.query(`
      SELECT * FROM user_emotional_profile 
      WHERE period_type = 'hour' AND user_id = 1
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toMatchObject({
      period_type: 'hour',
      data_points: expect.any(Number),
      avg_valence: expect.any(Number),
      std_valence: expect.any(Number)
    });
  });

  test('should return aggregated data by day', async () => {
    const result = await pool.query(`
      SELECT * FROM user_emotional_profile 
      WHERE period_type = 'day' AND user_id = 1
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].data_points).toBe(1); // 1 registro no dia de teste
  });

  test('should return aggregated data by week', async () => {
    const result = await pool.query(`
      SELECT * FROM user_emotional_profile 
      WHERE period_type = 'week' AND user_id = 2
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].data_points).toBe(2); // 2 registros na semana de teste
  });

  test('should have response time <20ms for complex queries', async () => {
    // Teste de performance com 1000 registros
    await pool.query(`
      INSERT INTO emotional_states 
        (user_id, valence, arousal, dominance, timestamp, source)
      SELECT 
        3, 
        random()*2-1, 
        random(), 
        random(),
        NOW() - (random() * INTERVAL '30 days'),
        CASE WHEN random() > 0.5 THEN 'self_report' ELSE 'biometric' END
      FROM generate_series(1, 1000)
    `);

    const start = Date.now();
    const result = await pool.query(`
      SELECT * FROM user_emotional_profile 
      WHERE user_id = 3 AND period BETWEEN NOW() - INTERVAL '7 days' AND NOW()
    `);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(20);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await pool.query('DELETE FROM emotional_states WHERE user_id IN (1, 2, 3)');
  });
});