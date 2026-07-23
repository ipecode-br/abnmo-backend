/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { config } from 'dotenv';
import { Pool } from 'pg';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const host = process.env.DB_HOST;
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const port = Number(process.env.DB_PORT);
const database = process.env.DB_DATABASE;

async function checkDatabase() {
  try {
    const pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      connectionTimeoutMillis: 2000,
    });

    await pool.query('SELECT 1');
    console.log('\n🟢 Database is ready and accepting connections\n');
    await pool.end();
  } catch (error) {
    process.stdout.write('.');
    setTimeout(checkDatabase, 250);
  }
}

process.stdout.write('\n\n🔴 Awaiting database accepting connections');
checkDatabase();
