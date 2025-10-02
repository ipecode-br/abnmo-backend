# Documentação de Configuração de Testes E2E

## Visão Geral

Esta configuração de testes E2E fornece um ambiente de teste isolado completo para a aplicação NestJS com limpeza de banco de dados e isolamento automático entre testes.

## Recursos principais

- **Limpeza de banco de dados**: Usa um banco de dados dedicado aos testes automatizados com limpeza completa antes/depois de cada teste
- **Isolamento automático**: Banco é limpo antes/depois de cada teste para prevenir conflitos
- **Requisições HTTP reais**: Testes simulam requisições de API reais (como Postman/Insomnia)
- **Testes de autenticação**: Suporta testes de autenticação baseada em token e cookie
- **Testes concorrentes**: Testes rodam em isolamento sem afetar uns aos outros

## Configuração Atual em Funcionamento

### Arquivos de Configuração

- `src/config/database.config.ts` - Factory de configuração de banco de dados
- `src/config/typeorm.config.ts` - Configurações TypeORM para dev/test
- `.env.test` - Variáveis de ambiente de teste

### Utilitários de Teste

- `test/test-utils.ts` - Factory de aplicação de teste e utilitários de banco
- `test/setup.ts` - Configuração e desmontagem global de teste
- `test/jest-e2e.json` - Configuração Jest para testes E2E
- `scripts/test-e2e.sh` - Script para executar testes E2E com ambiente adequado

### Testes Funcionais

- `test/app.e2e-spec.ts` - Conectividade básica da app e testes de banco
- `test/auth.e2e-spec.ts` - Testes de endpoints de autenticação (register/login)
- `test/patients.e2e-spec.ts` - Testes de endpoints de gerenciamento de pacientes

## Configuração de Ambiente

### Configuração de banco de dados

Seu arquivo `.env.test` deve conter:

```bash
NODE_ENV="test"
DB_HOST="localhost"
DB_PORT=3307
DB_DATABASE="abnmo_test"
DB_USERNAME="abnmo_user"
DB_PASSWORD="abnmo_password"
# ... outras variáveis de ambiente necessárias do seu .env principal
```

**Importante**: Os testes usam um banco de dados exclusivo (`abnmo_test`) na porta 3307, separado do banco de desenvolvimento. Isso garante isolamento completo entre ambientes de desenvolvimento e teste.

## Executando Testes

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
import request from 'supertest';
import { DataSource } from 'typeorm';
import { TestApp } from './test-utils';

describe('Feature (e2e)', () => {
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

  it('deve testar endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .send({ data: 'test' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Testando Autenticação

```typescript
// Logar e obter cookie de auth
const signInResponse = await request(app.getHttpServer())
  .post('/auth/sign-in')
  .send({ email: 'user@example.com', password: 'password123' })
  .expect(200);

const cookies = signInResponse.headers['set-cookie'];
const authCookie = cookies.find((cookie: string) =>
  cookie.startsWith('auth_token='),
);

// Usar cookie de auth em requisições subsequentes
const protectedResponse = await request(app.getHttpServer())
  .get('/protected-route')
  .set('Cookie', authCookie)
  .expect(200);
```

### Asserções de Banco de Dados

```typescript
import { User } from '@/domain/entities/user';

// Verificar se entidade foi criada
const userRepository = dataSource.getRepository(User);
const user = await userRepository.findOne({
  where: { email: 'test@example.com' },
});
expect(user).toBeTruthy();

// Verificar que banco está limpo
const count = await userRepository.count();
expect(count).toBe(0);
```

## Melhores Práticas

### 1. Isolamento de Teste

- Cada teste começa com banco limpo
- Testes não devem depender uns dos outros
- Use `beforeEach` e `afterEach` para limpeza

### 2. Dados de Teste Realistas

- Use dados realistas que correspondam às suas regras de validação
- Teste cenários válidos e inválidos
- Teste casos extremos e condições de fronteira

### 3. Fluxos Completos de Usuário

- Teste jornadas end-to-end do usuário
- Inclua fluxos de autenticação
- Teste cenários de erro

### 4. Verificação de Banco de Dados

- Sempre verifique mudanças de estado do banco
- Verifique casos positivos e negativos
- Garanta relacionamentos adequados de dados

## Solução de Problemas

### Problemas Comuns

1. **Timeout de Conexão**

   - Aumente timeout na configuração Jest
   - Verifique parâmetros de conexão do banco

2. **Erro de Banco Já Existe**

   - A configuração trata isso automaticamente
   - Garanta limpeza adequada em `afterAll`

3. **Porta Já em Uso**

   - Testes usam a mesma instância da app
   - Apenas uma conexão de banco de teste por suite de teste

4. **Problemas de Autenticação**
   - Verifique extração de cookie
   - Verifique configuração de middleware de autenticação

### Limpeza de banco de dados

Se testes falharem e deixarem o banco sujo:

```sql
-- Conectar ao MySQL e executar:
DROP DATABASE IF EXISTS abnmo_test;
```

## Arquitetura

### Estratégia de banco de teste

Esta configuração usa um banco de dados MySQL dedicado exclusivamente para testes:

1. **Banco dedicado**: Usa `abnmo_test` na porta 3307, completamente separado do desenvolvimento
2. **Sem sincronização**: O schema é assumido como já existente (via migrações manuais)
3. **Limpeza otimizada**: Limpa apenas dados entre testes, não recria tabelas
4. **Conexão reduzida**: Pool de conexões limitado para melhor performance em testes

### Substituição de módulo de banco de dados

O `DatabaseModule` detecta automaticamente ambiente de teste e usa configuração otimizada:

- **Desenvolvimento/Produção**: Banco regular com migrações
- **Teste**: Banco de teste dedicado com configurações otimizadas para performance

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

### Test Database Strategy

Instead of using MySQL schemas (which are equivalent to databases in MySQL), this setup:

1. Creates a separate test database (`{original}_test_e2e`)
2. Uses TypeORM's `synchronize: true` for test database
3. Clears all tables between tests
4. Drops test database after all tests complete

### Database Module Override

The `DatabaseModule` automatically detects test environment and uses test configuration:

- **Development/Production**: Regular database with migrations
- **Test**: Test database with schema synchronization

This ensures tests run against the correct database structure without affecting development data.

## Security Notes

- Test environment variables use dummy values for secrets
- Test database should be separate from production
- Never run E2E tests against production database
- Test credentials should not be used in production

## Performance

- Tests run with `maxWorkers: 1` to prevent database conflicts
- Connection pooling is reduced in test environment
- Database cleanup is optimized to be fast but thorough
