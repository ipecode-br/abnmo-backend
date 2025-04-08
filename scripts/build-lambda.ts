import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const buildFolder = '.lambda-build';
const zipFile = 'lambda.zip';

// Passos da pipeline de build organizados em funções
const steps = {
  // Limpa e recria a pasta de build
  cleanBuildFolder: () => {
    fs.removeSync(buildFolder);
    fs.ensureDirSync(buildFolder);
  },

  // Compila o TypeScript usando o comando `tsc`
  compile: () => {
    execSync('tsc --project tsconfig.build.json', { stdio: 'inherit' });
  },

  // Copia arquivos necessários para o deploy
  copyFiles: () => {
    fs.copySync('dist', path.join(buildFolder, 'dist'));
    fs.copySync('package.json', path.join(buildFolder, 'package.json'));
    if (fs.existsSync('package-lock.json')) {
      fs.copySync(
        'package-lock.json',
        path.join(buildFolder, 'package-lock.json'),
      );
    }
  },

  // Instala apenas as dependências de produção dentro da pasta de build
  installProdDeps: () => {
    execSync('npm install --omit=dev', {
      cwd: buildFolder,
      stdio: 'inherit',
    });
  },

  // Cria o arquivo zip com o conteúdo da pasta de build
  zip: () => {
    execSync(`cd ${buildFolder} && zip -r ../${zipFile} . > /dev/null`, {
      stdio: 'inherit',
    });
  },
};

// Executa os passos na ordem definida (sem uso de async, pois tudo é síncrono)
(() => {
  console.log('🚀 Iniciando build Lambda...');
  steps.cleanBuildFolder();
  steps.compile();
  steps.copyFiles();
  steps.installProdDeps();
  steps.zip();
  console.log('🎉 Lambda zip criado com sucesso!');
})();
