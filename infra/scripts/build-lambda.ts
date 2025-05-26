import * as path from 'path';
import { execSync } from 'child_process';
import { build } from 'esbuild';
import * as fs from 'fs-extra';

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
    entryPoints: ['src/lambda.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(outDir, 'index.js'),
    external: [
      'aws-sdk',
      'class-transformer',
      'class-transformer/storage',
      'class-validator',
      '@nestjs/microservices',
      '@nestjs/microservices/microservices-module',
      '@nestjs/websockets',
      '@nestjs/websockets/socket-module',
    ],
    minify: true,
    treeShaking: false,
    sourcemap: true,
  });

  if (await fs.pathExists(envFile)) {
    await fs.copy(envFile, path.join(outDir, '.env'));
  }

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
