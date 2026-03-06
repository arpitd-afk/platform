const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_g9vlqHMfc8Vs@ep-winter-mouse-airq3l4d-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  max: 10,                      // Neon pooler works best with lower max
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }, // Required for Neon
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

async function connectDB() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info(`Connected to PostgreSQL at ${process.env.DB_HOST || 'localhost'}`);
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow query detected', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
}

async function transaction(callback) {
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

module.exports = { pool, connectDB, query, transaction };
