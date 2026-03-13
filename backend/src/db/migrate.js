const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migration on Neon PostgreSQL...');
    console.log(`   Host: ${DATABASE_URL.match(/@([^/]+)\//)?.[1] || 'neon'}`);

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // Split on semicolons but keep transaction-safe
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');

    console.log('✅ Migration completed — all tables created');

    // Show created tables
    const tables = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log(`\n📋 Tables (${tables.rows.length}):`);
    tables.rows.forEach(r => console.log(`   • ${r.tablename}`));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
