import { execSync } from 'node:child_process';
import path from 'node:path';

const [, , name] = process.argv;

if (!name) {
  console.error('Migration name is required!');
  console.error('Usage: npm run db:generate <MigrationName>');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '../migrations');
const outputPath = path.join(migrationsDir, name);

const command = [
  'ts-node',
  '-r tsconfig-paths/register',
  './node_modules/typeorm/cli.js',
  'migration:generate',
  '-d ./infra/database/data.source.ts',
  outputPath,
].join(' ');

try {
  console.log(`Generating migration: ${outputPath}`);
  execSync(command, { stdio: 'inherit' });
  console.log('🟢 Migration generated successfully');
} catch (error) {
  console.error('🔴 Failed to generate migration:', error);
  process.exit(1);
}
