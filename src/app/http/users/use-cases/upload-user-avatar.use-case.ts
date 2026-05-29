import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DeleteFileUseCase } from '@/app/storage/use-cases/delete-file.use-case';
import { UploadFileUseCase } from '@/app/storage/use-cases/upload-file.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { AuthUser } from '@/common/types';
import { STORAGE_FOLDERS } from '@/config/storage';
import { User } from '@/domain/entities/user';
import { generateFileName } from '@/utils/generate-file-name';

interface UploadUserAvatarUseCaseInput {
  user: AuthUser;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

@Injectable()
@Log()
export class UploadUserAvatarUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    user,
    buffer,
    originalName,
    mimeType,
  }: UploadUserAvatarUseCaseInput): Promise<void> {
    const fileName = generateFileName({ originalName, replace: 'avatar' });

    const uploadedFile = await this.uploadFileUseCase.execute({
      folder: STORAGE_FOLDERS.users.avatars,
      visibility: 'private',
      buffer: buffer,
      fileName,
      mimeType,
    });

    const result = await this.usersRepository.update(user.id, {
      avatarUrl: uploadedFile.url,
    });

    if (!result.affected) {
      await this.deleteFileUseCase.execute(uploadedFile.s3Key);
      throw new InternalServerErrorException(
        'Não foi possível atualizar seu avatar.',
      );
    }

    this.logger.log('User avatar updated', { s3Key: uploadedFile.s3Key });
  }
}
