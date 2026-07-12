import request from 'supertest';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { User } from '@/domain/entities/user';

import { userFactory } from './factories/user.factory';
import { getTestApp, getTestDataSource } from './setup-e2e';

const DEFAULT_PASSWORD = 'TestPassword123!';

interface CreateOptions extends Partial<User> {
  login?: boolean;
}

async function createUserInDb(overrides: Partial<User>): Promise<User> {
  const app = getTestApp();
  const ds = getTestDataSource();
  const cryptoService = app.get(CryptographyService);

  const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

  const repo = ds.getRepository(User);
  const user = repo.create(
    userFactory({ password: hashedPassword, ...overrides }),
  );
  await repo.save(user);

  return user;
}

async function loginUser(user: User): Promise<string[]> {
  const app = getTestApp();

  const res = await request(app.getHttpServer())
    .post('/login')
    .send({ email: user.email, password: DEFAULT_PASSWORD })
    .expect(200);

  const rawCookies = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(rawCookies)
    ? rawCookies
    : rawCookies
      ? [rawCookies]
      : [];

  return cookies;
}

export async function createAdmin(
  options: Partial<User> & CreateOptions = {},
): Promise<{ admin: User; cookies: string[] }> {
  const { login, ...overrides } = options;
  const user = await createUserInDb({ role: 'admin', ...overrides });
  const cookies = login ? await loginUser(user) : [];

  return { admin: user, cookies };
}

export async function createMember(
  options: Partial<User> & CreateOptions = {},
): Promise<{ member: User; cookies: string[] }> {
  const { login, ...overrides } = options;
  const user = await createUserInDb({ role: 'member', ...overrides });
  const cookies = login ? await loginUser(user) : [];

  return { member: user, cookies };
}

export async function createSpecialist(
  options: Partial<User> & CreateOptions = {},
): Promise<{ specialist: User; cookies: string[] }> {
  const { login, ...overrides } = options;
  const user = await createUserInDb({ role: 'specialist', ...overrides });
  const cookies = login ? await loginUser(user) : [];

  return { specialist: user, cookies };
}

export async function createPatient(
  options: Partial<User> & CreateOptions = {},
): Promise<{ patient: User; cookies: string[] }> {
  const { login, ...overrides } = options;
  const user = await createUserInDb({ role: 'patient', ...overrides });
  const cookies = login ? await loginUser(user) : [];

  return { patient: user, cookies };
}
