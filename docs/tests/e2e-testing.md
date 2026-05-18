# Documentação de Configuração de Testes E2E

## Visão Geral

Esta configuração de testes E2E fornece um ambiente de teste isolado completo para a aplicação NestJS com limpeza de banco de dados otimizada e isolamento automático entre testes.

## Recursos principais

- **Setup global**: Aplicação criada uma vez e reutilizada em todos os testes para melhor performance
- **Limpeza inteligente de banco**: Banco limpo apenas quando necessário (troca de arquivo de teste)
- **API Client avançado**: Cliente HTTP com autenticação automática e métodos fluentes
- **Cache de usuários**: Usuários de teste reutilizados para melhor performance
- **Testes concorrentes**: Testes rodam em isolamento sem afetar uns aos outros

## API Client

O `tests/config/api-client.ts` é o coração dos testes E2E, fornecendo:

- **Interface fluente**: Construção intuitiva de requisições HTTP
- **Autenticação automática**: Criação de usuários e login transparente
- **Cache inteligente**: Reutilização de usuários para performance
- **Helpers de roles**: Métodos para criar usuários com roles específicos
- **Tratamento consistente**: Padronização de todas as requisições de teste

### Métodos Principais

```typescript
import { api } from '../config/api-client';

// Requisições básicas
await api(app).get('/endpoint').send();
await api(app).post('/endpoint').send(data);
await api(app).put('/endpoint').send(data);
await api(app).delete('/endpoint').send();

// Autenticação automática
const authenticatedApi = await api(app).createPatientAndLogin();
const adminApi = await api(app).createAdminAndLogin();
const nurseApi = await api(app).createNurseAndLogin();
```

## Configuração Atual em Funcionamento

### Arquivos de Configuração

- `tests/config/test-utils.ts` - Classe TestApp com métodos de criação, limpeza e destruição
- `tests/config/setup.ts` - Configuração global de teste com app compartilhada
- `tests/config/jest-e2e.json` - Configuração Jest para testes E2E
- `tests/config/api-client.ts` - Cliente API com autenticação e helpers
- `.env.test` - Variáveis de ambiente de teste

### Testes Funcionais

- `tests/e2e/app.spec.ts` - Conectividade básica da aplicação
- `tests/e2e/auth.spec.ts` - Testes de endpoints de autenticação (register/login)
- `tests/e2e/patients.spec.ts` - Testes de endpoints de gerenciamento de pacientes
- `tests/e2e/users.spec.ts` - Testes de endpoints de usuários

## Configuração de Ambiente

### Configuração de banco de dados

Seu arquivo `.env.test` deve conter:

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

# ... outras variáveis necessárias
```

**Importante**: Os testes usam um banco de dados exclusivo (`abnmo_test`) na porta 3307, separado do banco de desenvolvimento. Isso garante isolamento completo entre ambientes de desenvolvimento e teste.

## Executando Testes

### Scripts Disponíveis

```bash
# Preparar ambiente de teste (iniciar containers e migrar banco)
npm run test:prepare

# Executar testes E2E
npm run test:e2e

# Executar testes E2E em modo watch
npm run test:e2e:watch

# Executar testes E2E com cobertura
npm run test:e2e:cov

# Depurar testes E2E
npm run test:e2e:debug

# Parar containers de teste
npm run test:stop

# Parar e remover containers de teste
npm run test:down
```

## Escrevendo Testes E2E

### Estrutura Básica de Teste

```typescript
import { INestApplication } from '@nestjs/common';

import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  describe('GET /endpoint', () => {
    it('deve retornar dados válidos', async () => {
      const response = await api(app).get('/endpoint').send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /endpoint', () => {
    it('deve criar entidade com sucesso', async () => {
      const response = await api(app)
        .post('/endpoint')
        .send({ name: 'Test Entity' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Entity');
    });
  });
});
```

### Usando o API Client

O `api-client.ts` fornece uma interface fluente para fazer requisições HTTP:

```typescript
import { api } from '../config/api-client';

// Requisições básicas
const response = await api(app).get('/users').send();
const createResponse = await api(app).post('/users').send(userData);
const updateResponse = await api(app).put('/users/1').send(updateData);
const deleteResponse = await api(app).delete('/users/1').send();

// Com query parameters
const filteredResponse = await api(app)
  .get('/users')
  .query({ page: '1', limit: '10' })
  .send();

// Com headers customizados
const responseWithHeaders = await api(app)
  .get('/protected-route')
  .headers({ Authorization: 'Bearer token' })
  .send();

// Com expectativas de status
const response = await api(app).post('/users').send(userData).expect(201);
```

### Testando Autenticação

```typescript
import { api } from '../config/api-client';

describe('Auth Tests', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve fazer login e usar autenticação automaticamente', async () => {
    // Criar usuário e fazer login automaticamente
    const authenticatedApi = await api(app).createPatientAndLogin({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Usar API autenticada
    const profileResponse = await authenticatedApi.get('/profile').send();
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.email).toBe('test@example.com');
  });

  it('deve criar usuário com role específica', async () => {
    // Criar admin e fazer login
    const adminApi = await api(app).createAdminAndLogin();

    // Criar nurse
    const nurseApi = await api(app).createNurseAndLogin();

    // Verificar permissões diferentes
    const adminUsers = await adminApi.get('/users').send();
    const nurseUsers = await nurseApi.get('/users').send();

    expect(adminUsers.status).toBe(200);
    expect(nurseUsers.status).toBe(403); // Nurse não pode listar usuários
  });

  it('deve reutilizar usuários em cache para performance', async () => {
    // Primeiro teste cria e cacheia usuário admin
    const adminApi1 = await api(app).createAdminAndLogin();

    // Segundo teste reutiliza usuário do cache
    const adminApi2 = await api(app).createAdminAndLogin();

    // Ambos funcionam normalmente
    const response1 = await adminApi1.get('/admin/dashboard').send();
    const response2 = await adminApi2.get('/admin/dashboard').send();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});
```

### Asserções de Banco de Dados

```typescript
import { User } from '@/domain/entities/user';
import { getTestDataSource } from '../config/setup';

describe('Database Assertions', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve verificar criação de entidade', async () => {
    const dataSource = getTestDataSource();
    const userRepository = dataSource.getRepository(User);

    // Criar usuário via API
    await api(app).post('/register').send({
      name: 'Test User',
      email: 'db-test@example.com',
      password: 'password123',
    });

    // Verificar no banco
    const user = await userRepository.findOne({
      where: { email: 'db-test@example.com' },
    });

    expect(user).toBeTruthy();
    expect(user?.name).toBe('Test User');
    expect(user?.role).toBe('patient'); // Role padrão
  });

  it('deve verificar relacionamentos', async () => {
    const dataSource = getTestDataSource();
    const userRepository = dataSource.getRepository(User);

    // Criar usuário autenticado
    const authenticatedApi = await api(app).createPatientAndLogin();

    // Fazer alguma operação que cria relacionamento
    await authenticatedApi.post('/appointments').send({
      date: '2024-01-01',
      time: '10:00',
    });

    // Verificar relacionamentos no banco
    const userWithRelations = await userRepository.findOne({
      where: { email: authenticatedApi.user?.email },
      relations: { appointments: true },
    });

    expect(userWithRelations?.appointments).toHaveLength(1);
  });
});
```

## Melhores Práticas

### 1. Estrutura de Teste

- **Setup global**: Use `getTestApp()` ao invés de criar app em cada teste
- **Limpeza automática**: Banco é limpo automaticamente entre arquivos de teste
- **API Client**: Sempre use o `api()` client para requisições consistentes
- **Testes isolados**: Cada teste deve ser independente

### 2. Autenticação

- **Helpers automáticos**: Use `createUserAndLogin()` para criar usuário e logar
- **Roles específicas**: Use `createAdminAndLogin()`, `createNurseAndLogin()`, etc.
- **Cache de usuários**: Usuários são reutilizados automaticamente para performance
- **Testes de permissão**: Teste diferentes roles para verificar autorizações

### 3. Dados de Teste

- **Dados realistas**: Use dados que correspondam às validações da aplicação
- **Unicidade**: Use timestamps ou sufixos únicos para evitar conflitos
- **Cenários extremos**: Teste casos de borda e validações de entrada

### 4. Performance

- **Setup uma vez**: App é criada uma vez globalmente
- **Cache inteligente**: Usuários de teste são cacheados
- **Limpeza otimizada**: Banco limpo apenas quando necessário
- **Queries eficientes**: Use o API client para reduzir código boilerplate

## Solução de Problemas

### Problemas Comuns

1. **App não inicializada**

   ```typescript
   // Erro: Test app is not available
   // Solução: Garanta que está rodando testes E2E, não unitários
   ```

2. **Banco não limpo entre testes**

   - Use `clearTestDatabase()` se precisar forçar limpeza
   - Verifique se está mudando entre arquivos de teste

3. **Problemas de autenticação**

   - Verifique se endpoints de auth estão corretos (`/register`, `/login`)
   - Use `createUserAndLogin()` para autenticação automática

4. **Timeout de conexão**

   - Aumente timeout no `jest-e2e.json`
   - Verifique se containers de teste estão rodando

5. **Cache de usuários inválido**

   ```typescript
   import { clearUserCache } from '../config/api-client';

   // Limpar cache se usuários estiverem corrompidos
   clearUserCache();
   ```

### Limpeza manual de banco de dados

Se testes falharem e deixarem o banco sujo:

```sql
-- Conectar ao MySQL de teste e executar:
DROP DATABASE IF EXISTS abnmo_test;
CREATE DATABASE abnmo_test;
```

Ou use o script de reset:

```bash
npm run test:down
npm run test:prepare
```

## Arquitetura

### Estratégia de Setup Global

Esta configuração usa um setup global otimizado:

1. **App compartilhada**: Aplicação NestJS criada uma vez no `setup.ts` global
2. **Cache inteligente**: App cacheada para reutilização entre testes
3. **Limpeza automática**: Banco limpo apenas quando troca entre arquivos de teste
4. **Performance**: Reduz overhead de criação/destruição de app

### Cliente API Avançado

O `api-client.ts` fornece funcionalidades avançadas:

- **Interface fluente**: Métodos encadeáveis para construção de requisições
- **Autenticação automática**: Login e gerenciamento de cookies transparente
- **Cache de usuários**: Usuários de teste reutilizados para melhor performance
- **Helpers de roles**: Métodos convenientes para criar usuários com roles específicas
- **Tratamento de erros**: Melhor handling de respostas de erro

### Estratégia de Banco de Teste

1. **Banco dedicado**: Usa `abnmo_test` completamente separado do desenvolvimento
2. **Schema assumido**: Banco já deve ter schema correto (via migrações)
3. **Limpeza otimizada**: TRUNCATE para performance, fallback para DELETE
4. **Cooldown de limpeza**: Evita limpezas excessivas em sequência

### Substituição de Módulo de Banco de Dados

O setup detecta automaticamente ambiente de teste e usa configurações otimizadas:

- **Desenvolvimento/Produção**: Banco regular com todas as funcionalidades
- **Teste**: Banco de teste com configurações de performance e isolamento

## Notas de Segurança

- Variáveis de ambiente de teste usam valores dummy para segredos
- Banco de teste deve ser separado do de produção
- Nunca rode testes E2E contra banco de produção
- Credenciais de teste não devem ser usadas em produção

## Performance

- Testes rodam com `maxWorkers: 1` para prevenir conflitos no banco
- Pooling de conexões é reduzido em ambiente de teste
- Limpeza do banco é otimizada para ser rápida mas completa

````

### Testing Authentication

```typescript
// Sign in and get auth cookie
const signInResponse = await request(app.getHttpServer())
  .post('/auth/sign-in')
  .send({ email: 'user@example.com', password: 'password123' })
  .expect(200);

const cookies = signInResponse.headers['set-cookie'];
const authCookie = cookies.find((cookie: string) =>
  cookie.startsWith('auth_token='),
);

// Use auth cookie in subsequent requests
const protectedResponse = await request(app.getHttpServer())
  .get('/protected-route')
  .set('Cookie', authCookie)
  .expect(200);
````

### Database Assertions

```typescript
import { User } from '@/domain/entities/user';

// Check if entity was created
const userRepository = dataSource.getRepository(User);
const user = await userRepository.findOne({
  where: { email: 'test@example.com' },
});
expect(user).toBeTruthy();

// Verify database is clean
const count = await userRepository.count();
expect(count).toBe(0);
```

## Best Practices

### 1. Test Isolation

- Each test starts with a clean database
- Tests should not depend on each other
- Use `beforeEach` and `afterEach` for cleanup

### 2. Realistic Test Data

- Use realistic data that matches your validation rules
- Test both valid and invalid scenarios
- Test edge cases and boundary conditions

### 3. Complete User Flows

- Test end-to-end user journeys
- Include authentication flows
- Test error scenarios

### 4. Database Verification

- Always verify database state changes
- Check both positive and negative cases
- Ensure proper data relationships

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Increase timeout in Jest config
   - Check database connection parameters

2. **Database Already Exists Error**

   - The setup handles this automatically
   - Ensure proper cleanup in `afterAll`

3. **Port Already in Use**

   - Tests use the same app instance
   - Only one test database connection per test suite

4. **Authentication Issues**
   - Verify cookie extraction
   - Check authentication middleware setup

### Database Cleanup

If tests fail and leave the database dirty:

```sql
-- Connect to MySQL and run:
DROP DATABASE IF EXISTS abnmo_test_test_e2e;
```

## Architecture

### Substituição de Módulo de Banco de Dados

O setup detecta automaticamente ambiente de teste e usa configurações otimizadas:

- **Desenvolvimento/Produção**: Banco regular com todas as funcionalidades
- **Teste**: Banco de teste com configurações de performance e isolamento

## Segurança

- Variáveis de ambiente de teste usam valores dummy para segredos
- Banco de teste separado do produção
- Nunca rode testes E2E contra banco de produção
- Credenciais de teste não devem ser usadas em produção
- Cookies e JWT usam segredos de teste dedicados

## Performance

- **Setup global**: App criada uma vez, cacheada entre testes
- **Limpeza inteligente**: Banco limpo apenas entre arquivos de teste
- **Cache de usuários**: Usuários de teste reutilizados automaticamente
- **Conexões otimizadas**: Pool de conexões reduzido para testes
- **Jest configurado**: `maxWorkers: 1` para prevenir conflitos de banco
