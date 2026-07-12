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

import { UpdateReferralUseCase } from '@/app/http/referrals/use-cases/update-referral.use-case';
import { LogService } from '@/common/log/log.service';
import { Referral } from '@/domain/entities/referral';

describe('UpdateReferralUseCase', () => {
  let useCase: UpdateReferralUseCase;
  let referralsRepo: MockProxy<Repository<Referral>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();
  const referral = referralFactory(patient, {
    status: 'scheduled',
    specialist,
  });

  const baseInput = {
    id: referral.id,
    date: new Date('2024-06-15'),
    condition: 'stable',
    annotation: 'Updated annotation',
  } as const;

  beforeEach(async () => {
    referralsRepo = mock<Repository<Referral>>();

    const module = await Test.createTestingModule({
      providers: [
        UpdateReferralUseCase,
        {
          provide: getRepositoryToken(Referral),
          useValue: referralsRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateReferralUseCase);
  });

  it('allows with "update:referral:others"', async () => {
    const user = requestUserFactory({
      role: 'member',
      features: ['update:referral:others'],
    });
    referralsRepo.findOne.mockResolvedValue(referral);

    await useCase.execute({ ...baseInput, user });

    expect(referralsRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: referral.id } }),
    );
    expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
      date: baseInput.date,
      condition: baseInput.condition,
      annotation: baseInput.annotation,
    });
  });

  it('throws ForbiddenException without "update:referral" or "update:referral:others"', async () => {
    const user = requestUserFactory({ features: [] });
    referralsRepo.findOne.mockResolvedValue(referral);

    await expect(useCase.execute({ ...baseInput, user })).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('Specialist', () => {
    it('allows with "update:referral"', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['update:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await useCase.execute({ ...baseInput, user });

      expect(referralsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: referral.id } }),
      );
      expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
        date: baseInput.date,
        condition: baseInput.condition,
        annotation: baseInput.annotation,
      });
    });

    it('allows with "update:referral:others"', async () => {
      const user = requestUserFactory({
        id: 'other-id',
        role: specialist.role,
        features: ['update:referral:others'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await useCase.execute({ ...baseInput, user });

      expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
        date: baseInput.date,
        condition: baseInput.condition,
        annotation: baseInput.annotation,
      });
    });
  });

  describe('Patient', () => {
    it('allows with "update:referral" to update its own referral', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: ['update:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await useCase.execute({ ...baseInput, user });

      expect(referralsRepo.update).toHaveBeenCalledWith(referral.id, {
        date: baseInput.date,
        condition: baseInput.condition,
        annotation: baseInput.annotation,
      });
    });

    it('throws ForbiddenException without "update:referral"', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: [],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await expect(useCase.execute({ ...baseInput, user })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when trying to update another patient referral', async () => {
      const user = requestUserFactory({
        id: 'new-id',
        role: patient.role,
        features: ['update:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(referral);

      await expect(useCase.execute({ ...baseInput, user })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Edge cases', () => {
    it('throws NotFoundException when referral not found', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['update:referral'],
      });
      referralsRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({ ...baseInput, user, id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
      expect(referralsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'nonexistent' } }),
      );
    });

    it('throws BadRequestException when already canceled', async () => {
      const user = requestUserFactory({
        features: ['update:referral:others'],
      });
      const canceledReferral = {
        ...referral,
        status: 'canceled',
      } as Referral;
      referralsRepo.findOne.mockResolvedValue(canceledReferral);

      await expect(useCase.execute({ ...baseInput, user })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
