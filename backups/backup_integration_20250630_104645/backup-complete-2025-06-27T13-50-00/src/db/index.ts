// Database connection and utilities
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/matchit_db'
});

export { pool };
export default pool;
