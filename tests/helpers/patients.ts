import { User } from '@/domain/entities/user';

import { getTestDataSource } from '../config/setup-e2e';

export async function getPatientById(id: string): Promise<User | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(User);
  return await repo.findOne({
    relations: { survey: true },
    where: { id },
  });
}
