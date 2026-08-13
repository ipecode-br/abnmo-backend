import { execSync } from 'child_process';
import { build } from 'esbuild';
import * as fs from 'fs-extra';
import * as path from 'path';

const TARGETS = {
  api: {
    entry: 'dist/app/lambda.js',
    outDir: 'dist-lambda/api',
    zipFile: 'lambda-api.zip',
  },
  'email-worker': {
    entry: 'dist/workers/email/handler.js',
    outDir: 'dist-lambda/email-worker',
    zipFile: 'lambda-email-worker.zip',
  },
  'whatsapp-worker': {
    entry: 'dist/workers/whatsapp/handler.js',
    outDir: 'dist-lambda/whatsapp-worker',
    zipFile: 'lambda-whatsapp-worker.zip',
  },
} as const;

type Target = keyof typeof TARGETS;

async function buildTarget(target: Target) {
  const { entry, outDir, zipFile } = TARGETS[target];

  console.log(`Building ${target}...`);

  await fs.ensureDir(outDir);

  await build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: path.join(outDir, 'index.js'),
    minify: true,
    keepNames: true,
    treeShaking: true,
    sourcemap: false,
    external: [
      'class-transformer/storage',
      '@nestjs/microservices',
      '@nestjs/websockets/socket-module',
      '@nestjs/microservices/microservices-module',
      'pino-pretty',
      'expo-sqlite',
      'react-native-sqlite-storage',
      '@sap/hana-client',
      'hdb-pool',
      'mysql',
      'mysql2',
      'oracledb',
      'pg-native',
      'pg-query-stream',
      'sql.js',
      'sqlite3',
      'better-sqlite3',
      'ioredis',
      'redis',
      'mongodb',
      'mssql',
      'typeorm-aurora-data-api-driver',
      '@google-cloud/spanner',
    ],
  });

  try {
    execSync(`cd ${outDir} && zip -r ../${zipFile} .`, { stdio: 'inherit' });
    const { size } = await fs.stat(path.join('dist-lambda', zipFile));
    console.log(`Lambda bundle created: ${zipFile}`);
    console.log(`Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error(`Failed to zip ${target}:`, error);
    process.exit(1);
  }
}

async function buildAll() {
  console.log('Starting Lambda build...');

  await fs.ensureDir('dist-lambda');

  try {
    execSync('rm -rf dist dist-lambda lambda*.zip', { stdio: 'inherit' });
    execSync('npx nest build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed TypeScript build:', error);
    process.exit(1);
  }

  for (const target of Object.keys(TARGETS) as Target[]) {
    await buildTarget(target);
  }
}

const arg = process.argv[2] as Target | 'all' | undefined;

if (!arg || arg === 'all') {
  buildAll().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
} else if (TARGETS[arg]) {
  (async () => {
    try {
      execSync('rm -rf dist dist-lambda', { stdio: 'inherit' });
      execSync('npx nest build', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed TypeScript build:', error);
      process.exit(1);
    }

    await buildTarget(arg);
  })().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
} else {
  console.error(
    `Unknown target: ${arg}. Valid targets: ${Object.keys(TARGETS).join(', ')}, all`,
  );
  process.exit(1);
}
