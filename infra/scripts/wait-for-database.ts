/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const host = process.env.DB_HOST;
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const port = Number(process.env.DB_PORT);

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    await connection.ping();
    console.log('\n🟢 Database is ready and accepting connections\n');
    await connection.end();
  } catch (error) {
    process.stdout.write('.');
    setTimeout(checkDatabase, 250);
  }
}

process.stdout.write('\n\n🔴 Awaiting database accepting connections');
checkDatabase();
