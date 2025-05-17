import { execSync } from 'child_process';

const [, , name] = process.argv;

if (!name) {
  console.error('Migration name is required!');
  console.error('Usage: npm run db:gen <MigrationName>');
  process.exit(1);
}

const outputPath = `./infra/database/migrations/${name}`;
const command = `ts-node -r tsconfig-paths/register -P tsconfig.json ./node_modules/typeorm/cli.js migration:generate -d ./infra/database/data.source.ts ${outputPath}`;

try {
  console.log(`Generating migration: ${outputPath}`);
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('🔴 Failed to generate migration:', error);
  process.exit(1);
}
