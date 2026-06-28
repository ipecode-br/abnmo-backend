import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly logger: LogService,
  ) {}

  async execute({
    name,
    email,
    phone,
  }: CreateSurveySubmissionUseCaseInput): Promise<void> {
    const findOptions = { select: { id: true }, where: { email } };

    const [userWithSameEmail, submissionWithSameEmail] = await Promise.all([
      this.usersRepository.findOne(findOptions),
      this.surveySubmissionsRepository.findOne(findOptions),
    ]);

    if (userWithSameEmail) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail.',
        { cause: `User with <${email}> already exists` },
      );
    }

    if (submissionWithSameEmail) {
      throw new ConflictException(
        'Já existe um processo cadastrado neste e-mail.',
        { cause: `Submission with <${email}> already exists` },
      );
    }

    const submission = this.surveySubmissionsRepository.create({
      name,
      email,
      phone,
      status: 'pending',
    });

    await this.surveySubmissionsRepository.save(submission);

    this.logger.log('Survey initiated', { name, email, phone });
  }
}
