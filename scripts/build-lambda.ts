import { build } from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';

const outDir = '.lambda-esbuild';
const zipFile = 'lambda.zip';
const entryFile = 'src/lambda.ts';
const envFile = '.env';

async function bundleLambda() {
  console.log('🚀 Iniciando build Lambda com esbuild...');

  // 1. Limpa a pasta
  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  // 2. Build com esbuild
  await build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(outDir, 'index.js'),
    minify: true,
    // external: ['aws-sdk'],
  });

  // 3. Copia o .env para a build (se existir)
  if (await fs.pathExists(envFile)) {
    await fs.copy(envFile, path.join(outDir, '.env'));
  }

  // 4. Zipa a pasta de build
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(outDir, false);

  await archive.finalize();

  console.log(`✅ Lambda zip gerado com sucesso: ${zipFile}`);
}

bundleLambda().catch((err) => {
  console.error('❌ Erro ao gerar lambda:', err);
  process.exit(1);
});
