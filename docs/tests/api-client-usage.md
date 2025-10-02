# Cliente API para Testes E2E

## Visão geral

O cliente API fornece uma abstração limpa sobre o supertest para fazer requisições HTTP em testes E2E. Ele oferece interfaces fluente e funcional inspiradas em clientes API frontend.

## Uso Básico

### Importar e Configurar

```typescript
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Meus Testes E2E', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  // Seus testes aqui...
});
```

### Interface Fluente (Recomendada)

```typescript
// Requisições GET
const response = await api(app).get('/users').send();
const response = await api(app).get('/users').expect(200);

// Requisições POST
const response = await api(app).post('/users').send(userData);
const response = await api(app).post('/users').expect(201).send(userData);

// Requisições PUT
const response = await api(app).put('/users/1').send(updateData);

// Requisições PATCH
const response = await api(app).patch('/users/1').send(partialData);

// Requisições DELETE
const response = await api(app).delete('/users/1').send();
const response = await api(app).delete('/users/1').expect(204);
```

### Parâmetros de Query e Cabeçalhos

```typescript
// Parâmetros de query
const response = await api(app)
  .get('/users')
  .query({ page: '1', limit: '10' })
  .send();

// Cabeçalhos customizados
const response = await api(app)
  .post('/users')
  .headers({ 'Content-Type': 'application/json' })
  .send(userData);

// Combinando query e cabeçalhos
const response = await api(app).get('/users').query({ page: '1' }).expect(200);
```

### Interface Funcional

```typescript
// Requisição básica
const response = await api(app).request('/users', {
  method: 'GET',
  expect: 200,
});

// Com corpo e cabeçalhos
const response = await api(app).request('/users', {
  method: 'POST',
  body: userData,
  headers: { 'Content-Type': 'application/json' },
  expect: 201,
});

// Com parâmetros de query
const response = await api(app).request('/users', {
  method: 'GET',
  query: { page: '1', limit: '10' },
});
```

## Autenticação

### Usando Tokens JWT

```typescript
// Obter token primeiro (de login ou setup)
const loginResponse = await api(app).post('/login').send({
  email: 'user@example.com',
  password: 'password',
});

const token = loginResponse.body.token;

// Usar cliente autenticado
const authenticatedApi = api(app).withAuth(token);

// Todas as requisições incluirão cabeçalho Authorization
const profile = await authenticatedApi.get('/profile').send();
const updated = await authenticatedApi.put('/profile').send(updateData);
```

## Códigos de Status Esperados

### Código de Status Único

```typescript
// Espera exatamente 200
const response = await api(app).get('/users').expect(200);

// Espera exatamente 201
const response = await api(app).post('/users').expect(201).send(userData);
```

### Múltiplos Códigos de Status (para testes flexíveis)

```typescript
// Quando quiser lidar com múltiplas respostas válidas
const response = await api(app).get('/users').expect([200, 404]);

// Verificar o status atual no teste
expect([200, 404].includes(response.status)).toBe(true);
```

## Exemplos de Migração

### Antes (com supertest)

```typescript
const response = await request(app.getHttpServer())
  .post('/register')
  .send(userData)
  .expect(201);
```

### Depois (com cliente API)

```typescript
const response = await api(app).post('/register').expect(201).send(userData);

// Ou sem expect para testes mais flexíveis
const response = await api(app).post('/register').send(userData);
expect([200, 201, 400, 409].includes(response.status)).toBe(true);
```

## Exemplo Completo

```typescript
import { INestApplication } from '@nestjs/common';
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Gerenciamento de Usuários E2E', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('deve completar fluxo de registro de usuário', async () => {
    // 1. Registrar usuário
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123',
    };

    const registerResponse = await api(app)
      .post('/register')
      .expect(201)
      .send(userData);

    expect(registerResponse.body.success).toBe(true);

    // 2. Logar usuário
    const loginResponse = await api(app).post('/login').send({
      email: userData.email,
      password: userData.password,
    });

    expect([200, 201].includes(loginResponse.status)).toBe(true);

    const token = loginResponse.body.token;

    // 3. Acessar rota protegida
    const profileResponse = await api(app)
      .withAuth(token)
      .get('/profile')
      .expect(200);

    expect(profileResponse.body.email).toBe(userData.email);

    // 4. Atualizar perfil
    const updateResponse = await api(app)
      .withAuth(token)
      .put('/profile')
      .send({ name: 'John Updated' });

    expect([200, 204].includes(updateResponse.status)).toBe(true);
  });

  it('deve lidar com erros de validação', async () => {
    const invalidData = { email: 'invalid-email' };

    const response = await api(app).post('/register').send(invalidData);

    // Verificação flexível de status para erros de validação
    expect([400, 422].includes(response.status)).toBe(true);
    expect(response.body).toHaveProperty('message');
  });

  it('deve lidar com parâmetros de query', async () => {
    const response = await api(app)
      .get('/users')
      .query({ page: '1', limit: '5', search: 'john' })
      .send();

    expect([200, 401].includes(response.status)).toBe(true);

    if (response.status === 200) {
      expect(Array.isArray(response.body.users)).toBe(true);
    }
  });
});
```

## Benefícios

### Legibilidade

- Interface limpa e encadeável
- Nomes de métodos autoexplicativos
- Menos código boilerplate

### Flexibilidade

- Interfaces fluente e funcional
- Tratamento fácil de autenticação
- Verificação flexível de códigos de status

### Segurança de tipos

- Suporte completo ao TypeScript
- Tipagem adequada de respostas
- Suporte ao IntelliSense

### Consistência

- Mesmos padrões em todos os testes
- Autenticação reutilizável
- Tratamento padronizado de erros

## Recursos Avançados

### Cabeçalhos Customizados para Todas as Requisições

```typescript
// Para casos de uso específicos, você pode estender o cliente
class CustomApiClient extends ApiClient {
  async request(endpoint: string, options: RequestOptions = {}) {
    const headers = {
      'X-Test-Runner': 'jest',
      ...options.headers,
    };

    return super.request(endpoint, { ...options, headers });
  }
}
```

### Interceptadores de Requisição/Resposta

```typescript
// Você pode envolver o cliente para adicionar logging ou outros middlewares
function withLogging(apiClient: ApiClient) {
  const originalRequest = apiClient.request.bind(apiClient);

  apiClient.request = async (
    endpoint: string,
    options: RequestOptions = {},
  ) => {
    console.log(
      `Fazendo requisição ${options.method || 'GET'} para ${endpoint}`,
    );
    const response = await originalRequest(endpoint, options);
    console.log(`Resposta: ${response.status}`);
    return response;
  };

  return apiClient;
}

// Uso
const loggingApi = withLogging(api(app));
```

Este cliente API torna seus testes E2E mais legíveis e manuteníveis enquanto fornece os mesmos recursos poderosos do uso direto do supertest.
