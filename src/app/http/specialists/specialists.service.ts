import {
  BadRequestException,
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

import { CreateSpecialistDto } from './specialists.dtos';
import { SpecialistsRepository } from './specialists.repository';

@Injectable()
export class SpecialistsService {
  private readonly logger = new Logger(SpecialistsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly specialistsRepository: SpecialistsRepository,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async create(createSpecialistDto: CreateSpecialistDto): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const specialistsRepository = manager.getRepository(Specialist);

      let user: User | null = null;

      if (!createSpecialistDto.user_id) {
        const { email, name } = createSpecialistDto;

        if (!email || !name) {
          throw new BadRequestException(
            'E-mail e nome são obrigatórios quando o ID do usuário não for fornecido.',
          );
        }

        const existingUser = await usersRepository.findOne({
          where: { email },
        });

        if (existingUser) {
          throw new ConflictException('Este e-mail já está em uso.');
        }

        const randomPassword = Math.random().toString(36).slice(-8);
        const hashPassword =
          await this.cryptographyService.createHash(randomPassword);

        const newUser = usersRepository.create({
          email,
          name,
          password: hashPassword,
        });

        user = await usersRepository.save(newUser);
      } else {
        const registeredUser = await usersRepository.findOne({
          where: { id: createSpecialistDto.user_id },
        });
        user = registeredUser;
      }

      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      const specialistExists = await specialistsRepository.findOne({
        where: { user_id: user.id },
      });

      if (specialistExists) {
        throw new ConflictException('Este usuário já é um especialista.');
      }

      const specialist = specialistsRepository.create({
        ...createSpecialistDto,
        user_id: user.id,
      });

      const savedSpecialist = await specialistsRepository.save(specialist);

      this.logger.log(
        {
          id: savedSpecialist.id,
          user_id: savedSpecialist.user_id,
          email: user.email,
        },
        'Specialist registered successfully',
      );
    });
  }
}
