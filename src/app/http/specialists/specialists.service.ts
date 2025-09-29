import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Specialist } from '@/domain/entities/specialist';
import { User } from '@/domain/entities/user';

import { UpdateSpecialistDto } from './speacialists.dtos';
import { SpecialistsRepository } from './specialists.repository';

@Injectable()
export class SpecialistsService {
  private readonly logger = new Logger(SpecialistsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly specialistsRepository: SpecialistsRepository,
  ) {}

  public async update(
    id: string,
    updateSpecialistDto: UpdateSpecialistDto,
  ): Promise<void> {
    const specialist = await this.specialistsRepository.findById(id);

    if (!specialist) {
      this.logger.error(
        { email: updateSpecialistDto.email },
        'Update specialist failed: Specialist not found',
      );

      throw new NotFoundException('Especialista não encontrado.');
    }

    return await this.dataSource.transaction(async (manager) => {
      const usersDataSource = manager.getRepository(User);
      const specialistDataSource = manager.getRepository(Specialist);

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

      await specialistDataSource.save(specialist);

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
