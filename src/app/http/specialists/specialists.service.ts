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
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

import { TokensRepository } from '../auth/tokens.repository';
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
    private readonly tokensRepository: TokensRepository,
  ) {}

  async create(createSpecialistDto: CreateSpecialistDto): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const specialistsRepository = manager.getRepository(Specialist);
      const tokensRepository = manager.getRepository(Token);

      const inviteToken = await tokensRepository.findOne({
        where: { token: createSpecialistDto.token, type: 'invite_token' },
      });

      if (!inviteToken) {
        throw new NotFoundException('Token de convite inválido');
      }

      if (!inviteToken.email) {
        throw new BadRequestException('Token não possui e-mail associado.');
      }

      const existingUser = await usersRepository.findOne({
        where: { email: inviteToken.email },
      });

      if (existingUser) {
        throw new ConflictException('Este e-mail já está em uso.');
      }

      const hashPassword = await this.cryptographyService.createHash(
        createSpecialistDto.password,
      );

      const newUser = usersRepository.create({
        email: inviteToken.email,
        name: createSpecialistDto.name,
        password: hashPassword,
      });

      const user = await usersRepository.save(newUser);

      const specialistExists = await specialistsRepository.findOne({
        where: { user_id: user.id },
      });

      if (specialistExists) {
        throw new ConflictException('Este usuário já é um especialista.');
      }

      const specialist = specialistsRepository.create({
        specialty: createSpecialistDto.specialty,
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
