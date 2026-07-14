import { DataSource } from 'typeorm';

import { Referral } from '@/domain/entities/referral';

import { referralFactory } from '../config/factories/referral.factory';

export async function createReferral(
  dataSource: DataSource,
  overrides: Partial<Referral> & { patient: Referral['patient'] },
): Promise<Referral> {
  const repo = dataSource.getRepository(Referral);
  const { patient, ...rest } = overrides;
  const referral = repo.create(referralFactory(patient, rest));

  await repo.save(referral);

  return referral;
}

export async function getReferral(
  dataSource: DataSource,
  id: string,
): Promise<Referral | null> {
  const repo = dataSource.getRepository(Referral);
  const referral = await repo.findOne({ where: { id } });

  return referral;
}
