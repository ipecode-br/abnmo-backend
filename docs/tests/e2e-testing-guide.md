# Testes E2E - API Client Avançado

## Visão Geral

Esta aplicação NestJS apresenta um **ambiente de testes E2E completamente automatizado** com **API Client avançado** que simplifica drasticamente a escrita de testes. O sistema requer configuração mínima e fornece ferramentas poderosas para testar autenticação, autorização e APIs complexas.

## Benefícios Principais

- API Client Fluente: Interface intuitiva para requisições HTTP com autenticação automática
- Setup Global: Uma única instância da app compartilhada entre todos os testes
- Autenticação Automática: Criação e login de usuários com diferentes papéis
- Limpeza Inteligente: Banco limpo automaticamente apenas quando necessário
- Cache de Usuários: Reutilização de usuários para performance otimizada
- Testes de API Reais: Funcionam exatamente como Postman/Insomnia

## Escrevendo Testes

### Estrutura Básica de Teste

Todos os testes E2E seguem a mesma estrutura simples:

```typescript
import { INestApplication } from '@nestjs/common';
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  // Seus testes aqui...
});
```

### Exemplo de Teste Simples

```typescript
describe('Meus Testes E2E de Feature', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve funcionar perfeitamente', async () => {
    const response = await api(app).get('/meu-endpoint').send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  it('deve lidar com requisições POST', async () => {
    const response = await api(app)
      .post('/meu-endpoint')
      .send({ chave: 'valor' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Exemplo de Teste de Autenticação

```typescript
describe('Testes E2E de Auth', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve registrar e logar usuário', async () => {
    // Registrar usuário patient
    const registerResponse = await api(app).post('/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect([200, 201].includes(registerResponse.status)).toBe(true);

    // Logar automaticamente
    const authenticatedApi = await api(app).createUserAndLogin({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    // Usar API autenticada
    const profileResponse = await authenticatedApi.get('/profile').send();
    expect(profileResponse.status).toBe(200);
  });

  it('deve testar diferentes papéis de usuário', async () => {
    // Criar admin automaticamente
    const adminApi = await api(app).createAdminAndLogin();

    // Criar manager
    const managerApi = await api(app).createManagerAndLogin();

    // Testar permissões diferentes
    const adminUsers = await adminApi.get('/admin/users').send();
    const managerUsers = await managerApi.get('/admin/users').send();

    expect(adminUsers.status).toBe(200);
    expect(managerUsers.status).toBe(403); // Manager não tem acesso
  });
});
```

## Executando Testes

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

## O que Acontece Automaticamente

### Setup Global (`tests/config/setup.ts`)

Trata automaticamente de:

1. **Criação da app**: Cria instância da app NestJS uma vez para todos os testes
2. **Supressão de logs**: Oculta toda saída do console do NestJS durante os testes
3. **Limpeza inteligente**: Banco limpo apenas quando troca entre arquivos de teste
4. **Cache de app**: Reutiliza instância da app para performance
5. **Tratamento de erros**: Gerencia promessas não tratadas e limpeza

### API Client (`tests/config/api-client.ts`)

Fornece automaticamente:

1. **Interface fluente**: Métodos encadeáveis para requisições HTTP
2. **Autenticação automática**: Criação e login de usuários com diferentes papéis
3. **Cache de usuários**: Reutilização de usuários para performance (30s cache)
4. **Tratamento consistente**: Padronização de todas as requisições de teste

### Ciclo de Vida dos Testes

```
[Setup Global] → Criar app + suprimir logs + configurar cache
↓
[Arquivo de Teste 1] → Limpar banco + executar testes
↓
[Arquivo de Teste 2] → Limpar banco + executar testes
↓
[Desmontagem Global] → Limpar instância da app
```

## Exemplos Funcionais Atuais

Todos esses arquivos demonstram a nova abordagem com API Client:

- **`tests/e2e/app.spec.ts`** - Conectividade básica da aplicação
- **`tests/e2e/auth.spec.ts`** - Endpoints de autenticação
- **`tests/e2e/patients.spec.ts`** - Gerenciamento de pacientes
- **`tests/e2e/users.spec.ts`** - Gerenciamento de usuários

Cada arquivo é limpo e focado apenas nos testes reais usando o API Client!

## Arquivos de Configuração

### `tests/config/jest-e2e.json`

```json
{
  "preset": "ts-jest",
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testMatch": ["<rootDir>/e2e/**/*.spec.ts"],
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "maxWorkers": 1,
  "setupFilesAfterEnv": ["<rootDir>/config/setup.ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  },
  "testTimeout": 20000,
  "verbose": false,
  "silent": true,
  "forceExit": true,
  "detectOpenHandles": false,
  "transform": {
    "^.+\\.(t|ts)$": [
      "ts-jest",
      {
        "tsconfig": {
          "skipLibCheck": true,
          "incremental": true
        },
        "transpileOnly": true
      }
    ]
  },
  "cache": true,
  "cacheDirectory": "/tmp/jest_cache",
  "clearMocks": true,
  "restoreMocks": true
}
```

### `.env.test`

```bash
# Environment
NODE_ENV="test"
APP_ENVIRONMENT="local"

# Database
DB_HOST="localhost"
DB_PORT=3307
DB_DATABASE="abnmo_test"
DB_USERNAME="abnmo_user"
DB_PASSWORD="abnmo_password"

# API
API_PORT=3333

# Secrets
COOKIE_SECRET="test-cookie-secret-key-for-testing-only"
JWT_SECRET="test-jwt-secret-key-for-testing-only"
```

## Funções Auxiliares Disponíveis

### `getTestApp()`

Retorna a instância global da aplicação NestJS.

```typescript
import { getTestApp } from '../config/setup';

const app = getTestApp();
// Use com api(app) para requisições
```

### `getTestDataSource()`

Retorna o DataSource global do TypeORM (para acesso direto ao banco quando necessário).

```typescript
import { getTestDataSource } from '../config/setup';

const dataSource = getTestDataSource();
const userRepo = dataSource.getRepository(User);
const users = await userRepo.find();
```

### API Client - Métodos Principais

```typescript
import { api } from '../config/api-client';

// Requisições básicas
await api(app).get('/endpoint').send();
await api(app).post('/endpoint').send(data);
await api(app).put('/endpoint').send(data);
await api(app).delete('/endpoint').send();

// Autenticação automática
const patientApi = await api(app).createPatientAndLogin();
const adminApi = await api(app).createAdminAndLogin();
const managerApi = await api(app).createManagerAndLogin();
const nurseApi = await api(app).createNurseAndLogin();
const specialistApi = await api(app).createSpecialistAndLogin();

// Com dados customizados
const customUserApi = await api(app).createUserWithRoleAndLogin('admin', {
  name: 'Custom Admin',
  email: 'custom@example.com',
  password: 'custompass123',
});
```

## Solução de Problemas

### Problemas de Conexão com Banco de Dados

```bash
# Garantir que Docker está rodando
npm run test:prepare

# Verificar se o banco está acessível
mysql -h localhost -P 3307 -u abnmo_user -p abnmo_test

# Resetar ambiente se necessário
npm run test:down && npm run test:prepare
```

### Testes Rodando Lentos

- Testes rodam com `maxWorkers: 1` para prevenir conflitos no banco
- Instância única da app é compartilhada entre todos os testes
- Cache de usuários evita recriação desnecessária
- Limpeza do banco é otimizada (TRUNCATE vs DELETE)

### Problemas de Autenticação

```typescript
// Depurar problemas de auth
it('deve depurar autenticação', async () => {
  const app = getTestApp();

  try {
    const client = await api(app).createAdminAndLogin();
    const response = await client.get('/protected-endpoint').send();
    console.log('Status:', response.status);
    console.log('Body:', response.body);
  } catch (error) {
    console.error('Erro de autenticação:', error);
  }
});
```

### Problemas de Resolução de Módulos

- Verificar se o mapeamento de caminho `@/` funciona no seu IDE
- Garantir que `moduleNameMapper` em `jest-e2e.json` está correto
- Verificar caminhos dos arquivos nas declarações de import

## � Recursos Avançados do API Client

### Requisições com Query Parameters e Headers

```typescript
// Query parameters
const response = await api(app)
  .get('/users')
  .query({ page: '1', limit: '10', search: 'john' })
  .send();

// Headers customizados
const response = await api(app)
  .get('/protected')
  .headers({ 'X-Custom-Header': 'value' })
  .send();

// Combinação
const response = await api(app)
  .post('/upload')
  .headers({ 'Content-Type': 'multipart/form-data' })
  .send(formData);
```

### Testes de Cenários Complexos

```typescript
describe('Cenários Complexos', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve testar fluxo completo de usuário', async () => {
    // 1. Criar admin
    const adminApi = await api(app).createAdminAndLogin();

    // 2. Criar paciente
    const patientData = {
      name: 'João Silva',
      email: `patient-${Date.now()}@example.com`,
      phone: '11999999999',
    };

    const createResponse = await adminApi
      .post('/patients')
      .send(patientData)
      .expect(201);

    const patientId = createResponse.body.id;

    // 3. Buscar paciente criado
    const getResponse = await adminApi
      .get(`/patients/${patientId}`)
      .send()
      .expect(200);

    expect(getResponse.body.name).toBe(patientData.name);

    // 4. Atualizar paciente
    const updateResponse = await adminApi
      .put(`/patients/${patientId}`)
      .send({ name: 'João Silva Atualizado' })
      .expect(200);

    expect(updateResponse.body.name).toBe('João Silva Atualizado');
  });
});
```

### Verificações de Banco de Dados

```typescript
import { getTestDataSource } from '../config/setup';
import { User } from '@/domain/entities/user';

it('deve verificar estado do banco', async () => {
  const app = getTestApp();
  const dataSource = getTestDataSource();

  // Criar usuário via API
  await api(app).post('/register').send({
    name: 'Test User',
    email: 'db-test@example.com',
    password: 'password123',
  });

  // Verificar no banco
  const userRepository = dataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email: 'db-test@example.com' },
  });

  expect(user).toBeTruthy();
  expect(user?.role).toBe('patient');
});
```

## Exemplo de Resultados de Teste

```
> npm run test:e2e

PASS tests/e2e/app.spec.ts
PASS tests/e2e/auth.spec.ts
PASS tests/e2e/patients.spec.ts
PASS tests/e2e/users.spec.ts

Test Suites: 4 passed, 4 total
Tests: 12 passed, 12 total
Snapshots: 0 total
Time: 8.3s

Saída limpa sem logs do NestJS poluindo o terminal!
```
