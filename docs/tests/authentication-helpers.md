# Auxiliares de autenticação para testes E2E

Este documento explica como usar os auxiliares de autenticação para simplificar testes e2e para rotas protegidas.

## Visão geral

A plataforma ABNMO usa **autenticação baseada em cookie** com um cookie `access_token`. Os auxiliares de autenticação fornecem métodos convenientes para lidar com login, registro e requisições autenticadas sem repetir o fluxo de autenticação em cada teste.

## Métodos Disponíveis

### Cliente API Básico

```typescript
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

// Criar cliente API básico
const apiClient = api(app);
```

### Métodos de Autenticação

#### 1. `loginAs(credentials)` - Logar com credenciais existentes

```typescript
const authenticatedApi = await api(app).loginAs({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: false, // opcional
});

// Agora fazer requisições autenticadas
const response = await authenticatedApi.get('/users/profile').send();
```

#### 2. `createUserAndLogin(userData)` - Registrar e auto-logar

```typescript
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!',
};

const authenticatedApi = await api(app).createUserAndLogin(testUser);

// Usuário está registrado e logado
const response = await authenticatedApi.get('/users/profile').send();
```

#### 3. `withCookie(cookieString)` - Usar cookie existente

```typescript
// Se já tiver um cookie de auth
const authenticatedApi = api(app).withCookie('access_token=jwt_token_here');

const response = await authenticatedApi.get('/protected-route').send();
```

### Geração de Usuários de Teste

Use `AuthTestHelpers` para gerar usuários de teste únicos:

```typescript
import { AuthTestHelpers } from '../config/test-utils';

// Gerar um usuário de teste único com email único
const testUser = AuthTestHelpers.generateTestUser('my-test');
// Resultado: { name: 'Test User 1234567890', email: 'my-test-1234567890-123@example.com', password: 'TestPassword123!' }

// Gerar múltiplos usuários de teste
const testUsers = AuthTestHelpers.generateTestUsers(3, 'batch-test');
// Resulta em array de 3 usuários com emails únicos
```

## Exemplos de Uso

### Testando Rotas Protegidas

```typescript
describe('Rotas Protegidas', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('deve exigir autenticação', async () => {
    // Testar sem autenticação
    const response = await api(app).get('/users/profile').send();

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect((response.body as { message: string }).message).toContain(
      'Token de acesso ausente.',
    );
  });

  it('deve permitir acesso autenticado', async () => {
    // Create and login user
    const testUser = AuthTestHelpers.generateTestUser('profile-test');
    const authenticatedApi = await api(app).createUserAndLogin(testUser);

    // Acessar rota protegida
    const response = await authenticatedApi.get('/users/profile').send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toMatchObject({
      email: testUser.email,
      name: testUser.name,
    });
  });
});
```

### Testando Diferentes Papéis de Usuário

```typescript
describe('Acesso Baseado em Papéis', () => {
  it('deve testar com múltiplos usuários', async () => {
    // Criar múltiplos usuários de teste
    const users = AuthTestHelpers.generateTestUsers(2, 'role-test');

    // Logar cada usuário e testar
    for (const user of users) {
      const authenticatedApi = await api(app).createUserAndLogin(user);

      const response = await authenticatedApi.get('/some-endpoint').send();

      // Testar baseado no comportamento esperado para este usuário
      expect([200, 403].includes(response.status)).toBe(true);
    }
  });
});
```

### Testando com Usuários Existentes

```typescript
describe('Testes com Usuários Existentes', () => {
  it('deve logar com credenciais conhecidas', async () => {
    // Primeiro criar um usuário (pode ser em beforeAll)
    const userData = AuthTestHelpers.generateTestUser('known-user');
    await api(app).post('/register').send(userData);

    // Depois, logar com essas credenciais
    const authenticatedApi = await api(app).loginAs({
      email: userData.email,
      password: userData.password,
    });

    const response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(200);
  });
});
```

### Testando Logout

```typescript
describe('Logout', () => {
  it('deve deslogar usuário', async () => {
    const testUser = AuthTestHelpers.generateTestUser('logout-test');
    const authenticatedApi = await api(app).createUserAndLogin(testUser);

    // Usuário está autenticado
    let response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(200);

    // Logout
    await authenticatedApi.logout();

    // Tentar acessar rota protegida após logout
    response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(401);
  });
});
```

## Tratamento de Erros

Os auxiliares de autenticação lançam erros descritivos quando a autenticação falha:

```typescript
try {
  const authenticatedApi = await api(app).loginAs({
    email: 'invalid@example.com',
    password: 'wrongpassword',
  });
} catch (error) {
  // Erro incluirá status da resposta e corpo
  console.error('Login falhou:', error.message);
}
```

## Melhores práticas

1. **Use usuários de teste únicos**: Sempre use `AuthTestHelpers.generateTestUser()` para evitar conflitos entre testes.

2. **Teste cenários autenticados e não autenticados**: Sempre teste que as rotas rejeitam adequadamente requisições não autenticadas.

3. **Limpe o banco entre testes**: Use os utilitários de limpeza do banco para isolamento quando necessário.

4. **Evite estado de autenticação compartilhado**: Crie clientes autenticados frescos para cada teste para evitar efeitos colaterais.

5. **Teste cenários de erro**: Inclua testes para credenciais inválidas, tokens expirados, etc.

## Padrões comuns

```typescript
// Padrão 1: Testar não autenticado primeiro, depois autenticado
it('deve lidar com endpoint adequadamente', async () => {
  // Testar sem auth
  let response = await api(app).get('/endpoint').send();
  expect(response.status).toBe(401);

  // Testar com auth
  const authenticatedApi = await api(app).createUserAndLogin(
    AuthTestHelpers.generateTestUser('test'),
  );
  response = await authenticatedApi.get('/endpoint').send();
  expect(response.status).toBe(200);
});

// Padrão 2: Reutilizar cliente autenticado no bloco describe
describe('Gerenciamento de Usuários', () => {
  let authenticatedApi: AuthenticatedApiClient;

  beforeAll(async () => {
    const testUser = AuthTestHelpers.generateTestUser('user-mgmt');
    authenticatedApi = await api(app).createUserAndLogin(testUser);
  });

  it('deve obter perfil', async () => {
    const response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(200);
  });

  it('deve atualizar perfil', async () => {
    const response = await authenticatedApi.put('/users/profile').send({
      name: 'Nome Atualizado',
    });
    expect([200, 400].includes(response.status)).toBe(true);
  });
});
```
