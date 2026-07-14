import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { User } from '@/domain/entities/user';

import { userFactory } from '../config/factories/user.factory';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

const DEFAULT_PASSWORD = 'TestPassword123!';

export async function createUser(overrides: Partial<User> = {}): Promise<User> {
  const app = getTestApp();
  const cryptoService = app.get(CryptographyService);
  const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(User);
  const user = repo.create(
    userFactory({ password: hashedPassword, ...overrides }),
  );

  await repo.save(user);

  return user;
}

export async function getUser(id: string): Promise<User | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(User);
  return await repo.findOne({ where: { id } });
}
