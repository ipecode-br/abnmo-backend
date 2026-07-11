import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { adminUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { DeleteFileUseCase } from '@/app/storage/use-cases/delete-file.use-case';
import { UploadFileUseCase } from '@/app/storage/use-cases/upload-file.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import { UploadUserAvatarUseCase } from '../use-cases/upload-user-avatar.use-case';

const makeRequestUser = (
  overrides: Partial<RequestUser> = {},
): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: [],
  ...overrides,
});

describe('UploadUserAvatarUseCase', () => {
  let useCase: UploadUserAvatarUseCase;
  let userRepo: MockProxy<Repository<User>>;
  let uploadFileUseCase: MockProxy<UploadFileUseCase>;
  let deleteFileUseCase: MockProxy<DeleteFileUseCase>;
  let logger: { log: jest.Mock };

  beforeEach(async () => {
    userRepo = mock<Repository<User>>();
    uploadFileUseCase = mock<UploadFileUseCase>();
    deleteFileUseCase = mock<DeleteFileUseCase>();
    logger = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        UploadUserAvatarUseCase,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: UploadFileUseCase, useValue: uploadFileUseCase },
        { provide: DeleteFileUseCase, useValue: deleteFileUseCase },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(UploadUserAvatarUseCase);
  });

  const uploadInput = {
    buffer: Buffer.from('fake-image'),
    originalName: 'avatar.png',
    mimeType: 'image/png',
  };

  it('throws NotFoundException when user not found', async () => {
    const requestUser = makeRequestUser({ role: 'admin' });
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ ...uploadInput, user: requestUser }),
    ).rejects.toThrow(NotFoundException);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException without permission', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: [],
    });
    const targetUser = adminUserFactory({ id: 'member-1' });

    userRepo.findOne.mockResolvedValue(targetUser);

    await expect(
      useCase.execute({ ...uploadInput, user: requestUser }),
    ).rejects.toThrow(ForbiddenException);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('updates avatarUrl on success (admin)', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({
      id: admin.id,
      avatarUrl: null,
    });

    userRepo.findOne.mockResolvedValue(targetUser);

    uploadFileUseCase.execute.mockResolvedValue({
      url: 'https://cdn.example.com/private/avatars/users/user-1/avatar-fake.png',
      s3Key: 'private/avatars/users/user-1/avatar-fake.png',
      fileName: 'avatar-fake.png',
      size: '2.5 MB',
    });

    userRepo.update.mockResolvedValue({ affected: 1 } as any);

    await useCase.execute({ ...uploadInput, user: admin });

    expect(uploadFileUseCase.execute).toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalledWith(admin.id, {
      avatarUrl:
        'https://cdn.example.com/private/avatars/users/user-1/avatar-fake.png',
    });
    expect(logger.log).toHaveBeenCalled();
    expect(deleteFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('updates avatarUrl for self with update:user feature', async () => {
    const requestUser = makeRequestUser({
      id: 'self-id',
      role: 'member',
      features: ['update:user'],
    });
    const targetUser = adminUserFactory({
      id: 'self-id',
      avatarUrl: null,
    });

    userRepo.findOne.mockResolvedValue(targetUser);

    uploadFileUseCase.execute.mockResolvedValue({
      url: 'https://cdn.example.com/private/avatars/users/self-id/avatar-fake.png',
      s3Key: 'private/avatars/users/self-id/avatar-fake.png',
      fileName: 'avatar-fake.png',
      size: '2.5 MB',
    });

    userRepo.update.mockResolvedValue({ affected: 1 } as any);

    await useCase.execute({ ...uploadInput, user: requestUser });

    expect(uploadFileUseCase.execute).toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalledWith('self-id', expect.any(Object));
  });

  it('deletes previous avatar when replacing existing avatarUrl', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const previousAvatarUrl =
      'https://cdn.example.com/private/avatars/users/user-1/old-avatar.png';
    const targetUser = adminUserFactory({
      id: admin.id,
      avatarUrl: previousAvatarUrl,
    });

    userRepo.findOne.mockResolvedValue(targetUser);

    uploadFileUseCase.execute.mockResolvedValue({
      url: 'https://cdn.example.com/private/avatars/users/user-1/new-avatar.png',
      s3Key: 'private/avatars/users/user-1/new-avatar.png',
      fileName: 'new-avatar.png',
      size: '3.0 MB',
    });

    userRepo.update.mockResolvedValue({ affected: 1 } as any);

    await useCase.execute({ ...uploadInput, user: admin });

    expect(deleteFileUseCase.execute).toHaveBeenCalledWith(
      'private/avatars/users/user-1/old-avatar.png',
    );
  });
});
