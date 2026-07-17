/* eslint-disable @typescript-eslint/no-floating-promises */
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.test' });

async function dropTestSchema() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 2000,
  });

  try {
    await pool.query('DROP SCHEMA IF EXISTS test CASCADE');
    console.log('Test schema dropped');
  } finally {
    await pool.end();
  }
}

dropTestSchema();
