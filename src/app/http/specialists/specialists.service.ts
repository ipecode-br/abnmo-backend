import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Specialist } from '@/domain/entities/specialist';
import { User } from '@/domain/entities/user';
import type { BaseResponseSchema } from '@/domain/schemas/base';
import { AUTH_TOKENS_MAPPING } from '@/domain/schemas/token';
import type { UserRoleType } from '@/domain/schemas/user';
import { EnvService } from '@/env/env.service';

import { TokensRepository } from '../auth/tokens.repository';
import { UpdateSpecialistDto } from './specialists.dtos';
import { SpecialistsRepository } from './specialists.repository';

@Injectable()
export class SpecialistsService {
  private readonly logger = new Logger(SpecialistsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly specialistsRepository: SpecialistsRepository,
    private readonly cryptographyService: CryptographyService,
    private readonly tokensRepository: TokensRepository,
    private readonly envService: EnvService,
  ) {}

  async createInvite(
    email: string,
    role: UserRoleType,
  ): Promise<BaseResponseSchema> {
    const token = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.invite_token,
      { sub: email, role },
    );

    await this.tokensRepository.saveToken({
      user_id: null,
      email,
      token,
      type: AUTH_TOKENS_MAPPING.invite_token,
      expires_at: null,
    });

    const appUrl = this.envService.get('APP_URL');
    const url = `${appUrl}/conta/completar-cadastro?type=${role}&token=${token}`;

    this.logger.log({ url, email, role }, 'Invite created successfully');

    return {
      success: true,
      message: 'Convite criado com sucesso.',
    };
  }

  public async update(
    id: string,
    updateSpecialistDto: UpdateSpecialistDto,
  ): Promise<void> {
    const specialist =
      await this.specialistsRepository.findByIdWithRelations(id);

    if (!specialist) {
      this.logger.error(
        { email: updateSpecialistDto.email },
        'Update specialist failed: Specialist not found',
      );

      throw new NotFoundException('Especialista não encontrado.');
    }

    return await this.dataSource.transaction(async (manager) => {
      const usersDataSource = manager.getRepository(User);
      const specialistsDataSource = manager.getRepository(Specialist);

      if (specialist.name !== updateSpecialistDto.name) {
        await usersDataSource.update(specialist.user_id, {
          name: updateSpecialistDto.name,
        });
      }

      if (specialist.email !== updateSpecialistDto.email) {
        const existingUser = await usersDataSource.findOne({
          where: { email: updateSpecialistDto.email },
        });

        if (existingUser) {
          this.logger.error(
            { id: specialist.id, email: updateSpecialistDto.email },
            'Update specialist failed: E-mail already registered',
          );
          throw new ConflictException('Este e-mail já está em uso.');
        }

        await usersDataSource.update(specialist.user_id, {
          email: updateSpecialistDto.email,
        });
      }

      Object.assign(specialist, updateSpecialistDto);

      await specialistsDataSource.save(specialist);

      this.logger.log(
        {
          id: specialist.id,
          userId: specialist.user_id,
          email: specialist.email,
        },
        'Specialist updated successfully',
      );
    });
  }
}
