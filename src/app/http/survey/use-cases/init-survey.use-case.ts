import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

interface InitSurveyUseCaseInput {
  name: string;
  email: string;
  phone: string;
}

@Injectable()
@Log()
export class InitSurveyUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly logger: LogService,
  ) {}

  async execute({ name, email, phone }: InitSurveyUseCaseInput): Promise<void> {
    const userWithSameEmail = await this.usersRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (userWithSameEmail) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail.',
        { cause: `E-mail "${email}" already exists` },
      );
    }

    await this.surveySubmissionsRepository.save({
      name,
      email,
      phone,
      status: 'pending',
    });

    this.logger.log('Survey initiated', { name, email, phone });
  }
}
