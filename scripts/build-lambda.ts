import { execSync } from 'child_process';
import { build } from 'esbuild';
import fs from 'fs-extra';
import path from 'path';

const outDir = 'dist-lambda';
const zipFile = 'lambda.zip';
const envFile = '.env';

async function bundleLambda() {
  console.log('🚀 Building Lambda bundle...');

  // Clean directories
  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  // 1. First run NestJS build
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Use esbuild to bundle the lambda entry point
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

  // 3. Copy necessary files
  if (await fs.pathExists(envFile)) {
    await fs.copy(envFile, path.join(outDir, '.env'));
  }
  await fs.copy('dist', path.join(outDir, 'dist'));
  await fs.copy('node_modules', path.join(outDir, 'node_modules'));

  // 4. Create zip
  execSync(`cd ${outDir} && zip -r ../${zipFile} .`, { stdio: 'inherit' });

  console.log(`✅ Lambda bundle created: ${zipFile}`);
}

bundleLambda().catch((err) => {
  console.error('❌ Lambda build failed:', err);
  process.exit(1);
});
