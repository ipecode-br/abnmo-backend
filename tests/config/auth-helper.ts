import request from 'supertest';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { User } from '@/domain/entities/user';
import { USER_FEATURES } from '@/domain/enums/users';

import { userFactory } from './factories/user.factory';
import { getTestApp, getTestDataSource } from './setup-e2e';

const DEFAULT_PASSWORD = 'TestPassword123!';

export interface UserAndCookies {
  user: User;
  cookies: string[];
}

async function createUserAndLoginWithOpts(
  overrides: Partial<User> = {},
): Promise<UserAndCookies> {
  const app = getTestApp();
  const ds = getTestDataSource();
  const cryptoService = app.get(CryptographyService);

  const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

  const repo = ds.getRepository(User);
  const user = repo.create(
    userFactory({ password: hashedPassword, ...overrides }),
  );
  await repo.save(user);

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

  return { user, cookies };
}

export async function createUserAndLogin(
  overrides: Partial<User> = {},
): Promise<UserAndCookies> {
  return createUserAndLoginWithOpts(overrides);
}

export async function createAdminAndLogin(
  overrides: Partial<User> = {},
): Promise<UserAndCookies> {
  return createUserAndLoginWithOpts({
    role: 'admin',
    features: [...USER_FEATURES],
    ...overrides,
  });
}

export async function createSpecialistAndLogin(
  overrides: Partial<User> = {},
): Promise<UserAndCookies> {
  return createUserAndLoginWithOpts({
    role: 'specialist',
    features: [
      'read:appointment',
      'update:appointment',
      'create:appointment',
      'read:referral',
      'create:referral',
    ],
    ...overrides,
  });
}

export async function createPatientAndLogin(
  overrides: Partial<User> = {},
): Promise<UserAndCookies> {
  return createUserAndLoginWithOpts({ role: 'patient', ...overrides });
}

export async function createMemberAndLogin(
  overrides: Partial<User> = {},
): Promise<UserAndCookies> {
  return createUserAndLoginWithOpts({
    role: 'member',
    features: [
      'read:patient:others',
      'read:appointment:others',
      'read:survey:others',
      'read:survey',
    ],
    ...overrides,
  });
}
