# Autenticação Baseada em Papéis em Testes E2E

Este documento explica como usar o cliente API aprimorado para testar rotas protegidas com diferentes papéis de usuário.

## Visão Geral

O backend ABNMO usa controle de acesso baseado em papéis com 5 diferentes papéis de usuário:

- `admin` - Acesso completo ao sistema
- `manager` - Acesso em nível de gerenciamento
- `nurse` - Acesso de provedor de saúde
- `specialist` - Acesso de provedor de saúde especialista
- `patient` - Acesso em nível de paciente (padrão para registro)

## Problema

O endpoint padrão `/register` cria apenas usuários com o papel `patient`. Muitas rotas requerem permissões elevadas (`manager`, `nurse`, etc.), tornando difícil testar esses endpoints.

## Solução

O cliente API aprimorado fornece métodos para criar usuários com qualquer papel diretamente no banco de dados, contornando as limitações do endpoint de registro.

## Uso

### Estrutura Básica de Teste

Todos os testes E2E devem seguir a estrutura básica:

```typescript
import { INestApplication } from '@nestjs/common';
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));
  // ... seus testes aqui
});
```

### Uso Básico

```typescript
import { INestApplication } from '@nestjs/common';
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Testes de Rotas Protegidas', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve testar com papel específico', async () => {
    // Criar e logar como manager
    const client = await api(app).createManagerAndLogin();

    // Agora pode fazer requisições autenticadas
    const response = await client.get('/protected-endpoint').send();
    expect(response.status).toBe(200);
  });
});
```

### Métodos Disponíveis

#### Métodos de Conveniência Específicos por Papel

```typescript
// Criar usuários com papéis específicos
await api(app).createAdminAndLogin(); // Usuário admin
await api(app).createManagerAndLogin(); // Usuário manager
await api(app).createNurseAndLogin(); // Usuário nurse
await api(app).createSpecialistAndLogin(); // Usuário specialist
await api(app).createPatientAndLogin(); // Usuário patient (mesmo que createUserAndLogin)
```

#### Método Genérico de Papel

```typescript
// Criar usuário com qualquer papel
await api(app).createUserWithRoleAndLogin('nurse', {
  name: 'Enfermeira Customizada',
  email: 'nurse@example.com',
  password: 'custom123',
});
```

#### Customizando Dados de Usuário

Todos os métodos aceitam dados de usuário opcionais:

```typescript
await api(app).createManagerAndLogin({
  name: 'Test Manager',
  email: 'manager@example.com',
  password: 'securepassword123',
});
```

Se nenhum dado for fornecido, padrões são gerados:

- `name`: "Test {role} {timestamp}"
- `email`: "test-{role}-{timestamp}@example.com"
- `password`: "password123"

**Nota**: Quando nenhum `userData` é fornecido, o sistema usa cache inteligente para reutilizar usuários criados anteriormente, melhorando significativamente a performance dos testes.

## Testando Diferentes Níveis de Permissão

### Exemplo: Testando Endpoint de Pacientes

```typescript
describe('GET /patients', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve negar acesso para papel patient', async () => {
    const client = await api(app).createPatientAndLogin();
    await client.get('/patients').expect(401); // Retorna 401 para permissões insuficientes
  });

  it('deve permitir acesso para papel manager', async () => {
    const client = await api(app).createManagerAndLogin();
    await client.get('/patients').expect(200);
  });

  it('deve permitir acesso para papel nurse', async () => {
    const client = await api(app).createNurseAndLogin();
    await client.get('/patients').expect(200);
  });

  it('deve negar acesso para papel specialist', async () => {
    const client = await api(app).createSpecialistAndLogin();
    await client.get('/patients').expect(401); // Retorna 401 para permissões insuficientes
  });
});
```

## Melhores Práticas

### 1. Teste Todos os Níveis de Permissão

Para cada endpoint protegido, teste:

- Acesso não autenticado (deve retornar 401)
- Cada papel que deve ter acesso (deve retornar 2xx)
- Cada papel que NÃO deve ter acesso (deve retornar 401 - permissões insuficientes)

```typescript
describe('Endpoint Protegido', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('deve retornar 401 para requisições não autenticadas', async () => {
    await api(app).get('/protected').expect(401);
  });

  it('deve retornar 401 para permissões insuficientes', async () => {
    const client = await api(app).createPatientAndLogin();
    await client.get('/protected').expect(401);
  });

  it('deve permitir acesso para papéis autorizados', async () => {
    const client = await api(app).createManagerAndLogin();
    await client.get('/protected').expect(200);
  });
});
```

### 2. Use Emails Únicos para Testes de Criação

Ao testar endpoints de criação, garanta emails únicos para evitar conflitos:

```typescript
it('deve criar recurso', async () => {
  const app = getTestApp();
  const client = await api(app).createManagerAndLogin();
  const uniqueData = {
    name: 'Recurso de Teste',
    email: `test-${Date.now()}@example.com`, // Email único
  };

  await client.post('/resources').send(uniqueData).expect(201);
});
```

### 3. Agrupe Testes por Nível de Permissão

Organize testes para mostrar claramente quais papéis podem acessar quais endpoints:

```typescript
describe('Endpoints apenas para manager', () => {
  let app: INestApplication;
  let managerClient: AuthenticatedApiClient;

  beforeAll(async () => {
    app = getTestApp();
    managerClient = await api(app).createManagerAndLogin();
  });

  it('deve acessar dashboard do manager', async () => {
    await managerClient.get('/manager/dashboard').expect(200);
  });

  it('deve gerenciar usuários', async () => {
    await managerClient.get('/manager/users').expect(200);
  });
});
```

## Nos Bastidores

O auxiliar de autenticação baseada em papéis:

1. **Cria usuários diretamente no banco** - Contorna limitações do endpoint de registro
2. **Faz hash das senhas adequadamente** - Usa bcrypt com rounds de salt correspondendo à app
3. **Faz login automaticamente** - Obtém cookie de autenticação para uso imediato
4. **Cache inteligente de usuários** - Reutiliza usuários criados para performance (30s de cache)
5. **Geração automática de dados únicos** - Evita conflitos com timestamps e sufixos randômicos
6. **Retorna cliente autenticado** - Pronto para fazer requisições protegidas

## Solução de Problemas

### Problemas Comuns

**401 Unauthorized**: O usuário não tem permissão para este endpoint.

- Verifique os requisitos de papel do endpoint
- Garanta que está usando o papel correto para teste

**409 Conflict**: Recurso já existe (ex.: email duplicado, CPF).

- Use identificadores únicos para testes de criação
- Limpe banco de teste entre execuções se necessário

### Depurando Autenticação

```typescript
it('deve depurar autenticação', async () => {
  const app = getTestApp();
  const client = await api(app).createManagerAndLogin({
    email: 'debug@example.com',
  });

  // Testar se autenticação funciona
  const profileResponse = await client.get('/users/profile').send();
  expect(profileResponse.status).toBe(200);

  // Agora testar seu endpoint real
  const response = await client.get('/your-endpoint').send();
  console.log('Status da resposta:', response.status);
  console.log('Corpo da resposta:', response.body);
});
```

## Integração com Testes Existentes

Os novos métodos são totalmente compatíveis com padrões de teste existentes. Você pode migrar testes gradualmente ou usar ambas as abordagens:

```typescript
// Maneira antiga (ainda funciona para papel patient)
const oldClient = await api(app).createUserAndLogin({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
});

// Nova maneira (funciona para qualquer papel)
const newClient = await api(app).createManagerAndLogin();
```
