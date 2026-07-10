import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import {
  BASE_USER_FEATURES,
  USER_FEATURES,
  type UserFeature,
} from '@/domain/enums/users';

interface UpdateUserFeaturesUseCaseInput {
  id: string;
  user: RequestUser;
  features: UserFeature[];
}

@Injectable()
@Log()
export class UpdateUserFeaturesUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
    features,
  }: UpdateUserFeaturesUseCaseInput): Promise<void> {
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
        {
          cause: `User with ID <${user.id}> and role <${user.role}> does not have permission to update user features.`,
        },
      );
    }

    const userToUpdate = await this.usersRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!userToUpdate) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const invalidFeatures = features.filter(
      (feature) => !USER_FEATURES.includes(feature),
    );

    if (invalidFeatures.length > 0) {
      throw new BadRequestException(
        'Você forneceu funcionalidades inválidas.',
        { cause: `Invalid features: ${invalidFeatures.join(', ')}` },
      );
    }

    const mergedFeatures = [...new Set([...BASE_USER_FEATURES, ...features])];

    await this.usersRepository.update({ id }, { features: mergedFeatures });

    this.logger.log('User features updated', { id });
  }
}
