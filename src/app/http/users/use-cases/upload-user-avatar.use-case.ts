import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
    const userToUpdate = await this.usersRepository.findOne({
      select: { id: true, avatarUrl: true },
      where: { id: user.id },
    });

    if (!userToUpdate) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const fileName = generateFileName({ originalName, replace: 'avatar' });

    const file = await this.uploadFileUseCase.execute({
      folder: STORAGE_FOLDERS.users.avatars,
      visibility: 'private',
      buffer: buffer,
      fileName,
      mimeType,
    });

    const updateResult = await this.usersRepository.update(user.id, {
      avatarUrl: file.url,
    });

    if (!updateResult.affected) {
      await this.deleteFileUseCase.execute(file.s3Key);
      throw new InternalServerErrorException(
        'Não foi possível atualizar seu avatar.',
      );
    }

    const previousAvatarUrl = userToUpdate.avatarUrl;

    if (previousAvatarUrl) {
      const previousS3Key = new URL(previousAvatarUrl).pathname.substring(1);
      await this.deleteFileUseCase.execute(previousS3Key);
    }

    this.logger.log('User avatar updated', { s3Key: file.s3Key });
  }
}
