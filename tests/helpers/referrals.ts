import { Referral } from '@/domain/entities/referral';

import { referralFactory } from '../config/factories/referral.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createReferral(
  overrides: Partial<Referral> & { patient: Referral['patient'] },
): Promise<Referral> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Referral);
  const referral = repo.create(referralFactory(overrides));

  await repo.save(referral);

  return referral;
}

export async function getReferrals(): Promise<Referral[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Referral);
  return await repo.find({
    relations: { patient: true },
    select: { patient: { id: true, name: true, email: true } },
  });
}

export async function getReferralById(id: string): Promise<Referral | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Referral);
  return await repo.findOne({ where: { id } });
}
