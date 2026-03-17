import { Pool, QueryResult } from 'pg';
import logger from './logger';
import config from './config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

export async function connectDB() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info('Connected to PostgreSQL');
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow query detected', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
