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

  execSync('npm run build', { stdio: 'inherit' });

  await build({
    entryPoints: ['infra/lambda.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.join(outDir, 'index.js'),
    external: [
      '@nestjs/microservices',
      '@nestjs/websockets',
      'class-validator',
      'class-transformer',
    ],
    minify: true,
  });

  if (await fs.pathExists(envFile)) {
    await fs.copy(envFile, path.join(outDir, '.env'));
  }
  await fs.copy('dist', path.join(outDir, 'dist'));

  execSync(`cd ${outDir} && zip -r ../${zipFile} .`, { stdio: 'inherit' });

  console.log(`✅ Lambda bundle created: ${zipFile}`);
}

bundleLambda().catch((err) => {
  console.error('❌ Lambda build failed:', err);
  process.exit(1);
});
