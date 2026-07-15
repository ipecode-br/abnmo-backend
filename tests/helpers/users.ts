import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { User } from '@/domain/entities/user';

import { userFactory } from '../config/factories/user.factory';
import { TEST_DEFAULT_PASSWORD } from '../config/helpers';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

export async function createUser(overrides: Partial<User> = {}): Promise<User> {
  const app = getTestApp();

  const cryptoService = app.get(CryptographyService);
  const hashedPassword = await cryptoService.createHash(TEST_DEFAULT_PASSWORD);

  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(User);
  const user = repo.create(
    userFactory({ password: hashedPassword, ...overrides }),
  );

  await repo.save(user);

  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(User);
  return await repo.findOne({ where: { id } });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(User);
  return await repo.findOne({ where: { email } });
}
