import { execSync } from 'node:child_process';
import path from 'node:path';

import { build } from 'esbuild';
import fs from 'fs-extra';

const outDir = 'dist-lambda';
const zipFile = 'lambda.zip';
const envFile = '.env';

async function bundleLambda() {
  console.log('🚀 Building Lambda bundle...');

  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed TypeScript build:', error);
    process.exit(1);
  }

  await build({
    entryPoints: ['./src/app/lambda.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(outDir, 'index.js'),
    external: [
      '@vendia/serverless-express',
      '@nestjs/microservices',
      '@nestjs/microservices/microservices-module',
      '@nestjs/websockets',
      '@nestjs/websockets/socket-module',
      'aws-sdk',
      'class-transformer/storage',
    ],
    minify: true,
  });

  if (await fs.pathExists(envFile)) {
    await fs.copy(envFile, path.join(outDir, '.env'));
  }
  await fs.copy('dist', path.join(outDir, 'dist'));

  try {
    execSync(`cd ${outDir} && zip -r ../${zipFile} .`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to zip Lambda package:', error);
    process.exit(1);
  }

  const { size } = await fs.stat(zipFile);
  console.log(`✅ Lambda bundle created: ${zipFile}`);
  console.log(`📦 Zip size: ${(size / 1024 / 1024).toFixed(2)} MB`);
}

bundleLambda().catch((error) => {
  console.error('❌ Lambda build failed:', error);
  process.exit(1);
});
