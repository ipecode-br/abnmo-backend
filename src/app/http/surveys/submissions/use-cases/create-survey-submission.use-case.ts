import { randomBytes } from 'node:crypto';

import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

interface CreateSurveySubmissionUseCaseInput {
  name: string;
  email: string;
  phone: string;
}

@Injectable()
@Log()
export class CreateSurveySubmissionUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
    private readonly logger: LogService,
  ) {}

  async execute({
    name,
    email,
    phone,
  }: CreateSurveySubmissionUseCaseInput): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail.',
        { cause: `User with <${email}> already exists` },
      );
    }

    const randomPassword = randomBytes(16).toString('hex');
    const password = await this.cryptographyService.createHash(randomPassword);

    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const submissionsRepository = manager.getRepository(SurveySubmission);

      const user = usersRepository.create({
        name,
        email,
        phone,
        password,
        role: 'patient',
        status: 'pending',
      });
      await usersRepository.save(user);

      const submission = submissionsRepository.create({
        user: { id: user.id },
      });
      await submissionsRepository.save(submission);

      this.logger.log('Survey initiated', {
        id: submission.id,
        userId: user.id,
        email,
        phone,
      });
    });
  }
}
