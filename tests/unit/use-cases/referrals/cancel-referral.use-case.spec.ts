import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { referralFactory } from 'tests/config/factories/referral.factory';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import {
  patientUserFactory,
  specialistUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CancelReferralUseCase } from '@/app/http/referrals/use-cases/cancel-referral.use-case';
import { LogService } from '@/common/log/log.service';
import { Referral } from '@/domain/entities/referral';

describe('CancelReferralUseCase', () => {
  let useCase: CancelReferralUseCase;
  let referralsRepo: MockProxy<Repository<Referral>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();
  const referral = referralFactory({
    status: 'scheduled',
    specialist,
    patient,
  });

  beforeEach(async () => {
    referralsRepo = mock<Repository<Referral>>();

    const module = await Test.createTestingModule({
      providers: [
        CancelReferralUseCase,
        {
          provide: getRepositoryToken(Referral),
          useValue: referralsRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CancelReferralUseCase);
  });

  it('allows with "cancel:referral:others"', async () => {
    const user = requestUserFactory({
      role: 'member',
      features: ['cancel:referral:others'],
    });
    referralsRepo.findOne.mockResolvedValue(referral);

    await useCase.execute({ user, id: referral.id });

    expect(referralsRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: referral.id } }),
    );
    expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
      status: 'canceled',
    });
  });

  it('throws "ForbiddenException" without "cancel:referral" or "cancel:referral:others"', async () => {
    const user = requestUserFactory({ features: [] });
    referralsRepo.findOne.mockResolvedValue(referral);

    await expect(useCase.execute({ user, id: referral.id })).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('Specialist', () => {
    it('allows with "cancel:referral:others"', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['cancel:referral:others'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await useCase.execute({ user, id: referral.id });

      expect(referralsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: referral.id } }),
      );
      expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
        status: 'canceled',
      });
    });

    it('allows with "cancel:referral:others"', async () => {
      const user = requestUserFactory({
        id: 'other-id',
        role: specialist.role,
        features: ['cancel:referral:others'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await useCase.execute({ user, id: referral.id });

      expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
        status: 'canceled',
      });
    });
  });

  describe('Patient', () => {
    it('allows with "cancel:referral" to cancel its own referral', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: ['cancel:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await useCase.execute({ user, id: referral.id });

      expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
        status: 'canceled',
      });
    });

    it('throws ForbiddenException without "cancel:referral"', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: [],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await expect(useCase.execute({ user, id: referral.id })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when trying to cancel another patient referral', async () => {
      const user = requestUserFactory({
        id: 'new-id',
        role: patient.role,
        features: ['cancel:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await expect(useCase.execute({ user, id: referral.id })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Edge cases', () => {
    it('throws NotFoundException when referral not found', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['cancel:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({ user, id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
      expect(referralsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'nonexistent' } }),
      );
    });

    it('throws BadRequestException when already canceled', async () => {
      const user = requestUserFactory({
        features: ['cancel:referral:others'],
      });
      const canceledReferral = {
        ...referral,
        status: 'canceled',
      } as Referral;
      referralsRepo.findOne.mockResolvedValue(canceledReferral);

      await expect(
        useCase.execute({ user, id: canceledReferral.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
