# Testes E2E - configuração zero boilerplate

## Visão geral

Esta aplicação NestJS apresenta um **ambiente de testes E2E completamente automatizado** que requer **zero código boilerplate** em seus arquivos de teste. Basta escrever seus testes, e tudo o resto é tratado automaticamente!

## Benefícios principais

- **Zero boilerplate**: Não há necessidade de `beforeAll`, `afterAll`, `beforeEach`, `afterEach` nos arquivos de teste
- **Execução silenciosa**: Todos os logs do NestJS são suprimidos durante os testes para saída limpa
- **Limpeza automática**: O banco de dados é limpo antes/depois de cada teste automaticamente
- **Instância global da app**: Uma única instância da app compartilhada entre todos os testes (execução mais rápida)
- **Testes de API reais**: Os testes funcionam exatamente como requisições do Postman/InsomniaE - Configuração Zero Boilerplate

## Visão Geral

Esta aplicação NestJS agora apresenta um **ambiente de testes E2E completamente automatizado** que requer **zero código boilerplate** em seus arquivos de teste. Basta escrever seus testes, e tudo o resto é tratado automaticamente!

## 🎯 Benefícios Principais

- ✅ **Zero Boilerplate**: Não há necessidade de `beforeAll`, `afterAll`, `beforeEach`, `afterEach` nos arquivos de teste
- ✅ **Execução Silenciosa**: Todos os logs do NestJS são suprimidos durante os testes para saída limpa
- ✅ **Limpeza Automática**: O banco de dados é limpo antes/depois de cada teste automaticamente
- ✅ **Instância Global da App**: Uma única instância da app compartilhada entre todos os testes (execução mais rápida)
- ✅ **Testes de API Reais**: Os testes funcionam exatamente como requisições do Postman/Insomnia

## 📝 Escrevendo Testes

### Exemplo de Teste Simples

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from './setup';

describe('Meus Testes E2E de Feature', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp(); // Isso é tudo! Não há async, não há setup, não há cleanup!
  });

  it('deve funcionar perfeitamente', async () => {
    const response = await request(app.getHttpServer()).get('/meu-endpoint');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  it('deve lidar com requisições POST', async () => {
    const response = await request(app.getHttpServer())
      .post('/meu-endpoint')
      .send({ chave: 'valor' });

    expect(response.status).toBe(201);
  });
});
```

### Exemplo de Teste de Autenticação

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from './setup';

describe('Testes E2E de Auth', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('deve registrar e logar usuário', async () => {
    // Registrar
    const registerResponse = await request(app.getHttpServer())
      .post('/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

    expect([200, 201].includes(registerResponse.status)).toBe(true);

    // Logar
    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect([200, 201].includes(loginResponse.status)).toBe(true);
  });
});
```

## 🚀 Executando Testes

```bash
# Preparar ambiente de teste (iniciar containers e migrar banco)
npm run test:prepare

# Executar todos os testes E2E
npm run test:e2e

# Executar arquivo de teste específico
npm run test:e2e -- auth.e2e-spec.ts

# Executar em modo watch
npm run test:e2e:watch

# Executar com cobertura
npm run test:e2e:cov

# Depurar testes E2E
npm run test:e2e:debug

# Parar containers de teste
npm run test:stop

# Parar e remover containers de teste
npm run test:down
```

## O que acontece automaticamente

### Configuração global (`test/setup.ts`)

Trata automaticamente de:

1. **Criação da app**: Cria instância da app NestJS uma vez para todos os testes
2. **Supressão de logs**: Oculta toda saída do console do NestJS durante os testes
3. **Limpeza do banco**: Limpa o banco de dados antes e depois de cada teste
4. **Tratamento de erros**: Gerencia promessas não tratadas e limpeza
5. **Funções auxiliares**: Fornece `getTestApp()` e `getTestDataSource()`

### Ciclo de vida dos testes

```
[Configuração global] → Criar instância da app + suprimir logs
↓
[Antes de cada teste] → Limpar banco de dados
↓
[Seu teste] → Executa com banco limpo
↓
[Depois de cada teste] → Limpar banco de dados novamente
↓
[Desmontagem global] → Limpar instância da app
```

## Exemplos funcionais atuais

Todos esses arquivos demonstram a nova abordagem zero-boilerplate:

- **`test/app.e2e-spec.ts`** - Conectividade básica da app
- **`test/auth.e2e-spec.ts`** - Endpoints de autenticação
- **`test/patients.e2e-spec.ts`** - Gerenciamento de pacientes

Cada arquivo é limpo e focado apenas nos testes reais!

## Arquivos de configuração

### `test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|ts)$": "ts-jest"
  },
  "maxWorkers": 1,
  "setupFilesAfterEnv": ["<rootDir>/setup.ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  },
  "testTimeout": 60000
}
```

### `.env.test`

```bash
NODE_ENV="test"
DB_HOST="localhost"
DB_PORT=3307
DB_DATABASE="abnmo_test"
DB_USERNAME="abnmo_user"
DB_PASSWORD="abnmo_password"
# ... outras variáveis de ambiente
```

## Funções auxiliares disponíveis

### `getTestApp()`

Retorna a instância global da aplicação NestJS.

```typescript
import { getTestApp } from './setup';

const app = getTestApp();
const response = await request(app.getHttpServer()).get('/endpoint');
```

### `getTestDataSource()`

Retorna o DataSource global do TypeORM (se precisar de acesso direto ao banco).

```typescript
import { getTestDataSource } from './setup';

const dataSource = getTestDataSource();
const userRepo = dataSource.getRepository(User);
const users = await userRepo.find();
```

## Solução de problemas

### Problemas de conexão com banco de dados

```bash
# Garantir que Docker está rodando
docker-compose -f infra/docker/compose-test.yaml up -d

# Verificar se o banco está acessível
mysql -h localhost -P 3307 -u abnmo_user -p abnmo_test
```

### Testes rodando lentos

- Testes rodam com `maxWorkers: 1` para prevenir conflitos no banco
- Instância única da app é compartilhada entre todos os testes para execução mais rápida
- Limpeza do banco é otimizada para limpar apenas dados, não recriar schema

### Problemas de resolução de módulos

- Verificar se o mapeamento de caminho `@/` funciona no seu IDE
- Garantir que `moduleNameMapper` em `jest-e2e.json` está correto
- Verificar caminhos dos arquivos nas declarações de import

## Exemplo de resultados de teste

## 📊 Exemplo de Resultados de Teste

```

```

> npm run test:e2e

PASS test/app.e2e-spec.ts
PASS test/auth.e2e-spec.ts
PASS test/patients.e2e-spec.ts

Test Suites: 3 passed, 3 total
Tests: 6 passed, 6 total
Snapshots: 0 total
Time: 7.2s

```

Saída limpa sem logs do NestJS poluindo o terminal!

## Guia de migração

Para converter testes E2E existentes para a nova abordagem zero-boilerplate:
```

Saída limpa sem logs do NestJS poluindo o terminal!

## ✨ Guia de Migração

Para converter testes E2E existentes para a nova abordagem zero-boilerplate:

### Antes

```typescript
describe('Teste antigo', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const testAppSetup = await TestApp.create();
    app = testAppSetup.app;
    dataSource = testAppSetup.dataSource;
  });

  afterAll(async () => {
    await TestApp.destroy(app, dataSource);
  });

  beforeEach(async () => {
    await TestApp.clearDatabase(dataSource);
  });

  afterEach(async () => {
    await TestApp.clearDatabase(dataSource);
  });

  // testes...
});
```

### Depois

```typescript
import { getTestApp } from './setup';

describe('Novo teste', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  // testes...
});
```
