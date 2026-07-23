/* eslint-disable @typescript-eslint/no-floating-promises */
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.test' });

async function createTestSchema() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 2000,
  });

  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS test');
    console.log('Test schema ready');
  } finally {
    await pool.end();
  }
}

createTestSchema();
