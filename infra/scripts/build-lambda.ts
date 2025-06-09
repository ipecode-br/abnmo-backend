import { execSync } from 'child_process';
import { build } from 'esbuild';
import * as fs from 'fs-extra';
import * as path from 'path';

const outDir = 'dist-lambda';
const zipFile = 'lambda.zip';

async function buildLambda() {
  console.log('🚀 Starting Lambda build...');

  await fs.ensureDir(outDir);

  try {
    execSync('npm run build:clean', { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed TypeScript build:', error);
    process.exit(1);
  }

  await build({
    entryPoints: ['dist-lambda/app/lambda.js'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(outDir, 'index.js'),
    minify: false,
    treeShaking: false,
    sourcemap: false,
    external: [
      'class-transformer/storage',
      '@nestjs/microservices',
      '@nestjs/websockets/socket-module',
      '@nestjs/microservices/microservices-module',
    ],
  });

  try {
    execSync(`cd ${outDir} && zip -r ../${zipFile} .`, { stdio: 'inherit' });
    const { size } = await fs.stat(zipFile);
    console.log(`✅ Lambda bundle created: ${zipFile}`);
    console.log(`📦 Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Failed to zip:', error);
    process.exit(1);
  }
}

buildLambda().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
