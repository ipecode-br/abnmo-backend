import { execSync } from 'child_process';
import { build } from 'esbuild';
import * as fs from 'fs-extra';
import * as path from 'path';

const outDir = 'dist-docker';

async function buildDocker() {
  console.log('Starting Docker build...');

  await fs.ensureDir(outDir);

  try {
    execSync('rm -rf dist dist-docker', { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed TypeScript build:', error);
    process.exit(1);
  }

  await build({
    entryPoints: ['dist/app/main.js'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: path.join(outDir, 'main.js'),
    minify: false,
    sourcemap: false,
    treeShaking: true,
    external: [
      // Nest optional deps
      '@nestjs/websockets',
      '@nestjs/websockets/socket-module',
      '@nestjs/microservices',
      '@nestjs/microservices/microservices-module',
      'class-transformer/storage',
      // Runtime heavy libs (keep external)
      '@aws-sdk/*',
      'typeorm',
      'mysql2',
      'pino',
      'pino-http',
    ],
  });

  console.log('Docker bundle created in /dist-docker');
}

buildDocker().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
