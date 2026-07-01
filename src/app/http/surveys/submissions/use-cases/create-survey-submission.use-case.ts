import { randomBytes } from 'node:crypto';

import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { GenerateUploadUrlUseCase } from '@/app/storage/use-cases/generate-upload-url.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { STORAGE_FOLDERS } from '@/config/storage';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import {
  SURVEY_DOCUMENT_TYPES,
  type SurveyDocumentType,
} from '@/domain/enums/surveys';
import { generateFileName } from '@/utils/generate-file-name';

interface CreateSurveySubmissionUseCaseInput {
  name: string;
  email: string;
  phone: string;
  fileSize: number;
  mimeType: SurveyDocumentType;
}

interface CreateSurveySubmissionUseCaseOutput {
  submissionId: string;
  key: string;
  url: string;
  fields: Record<string, string>;
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
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    name,
    email,
    phone,
    mimeType,
    fileSize,
  }: CreateSurveySubmissionUseCaseInput): Promise<CreateSurveySubmissionUseCaseOutput> {
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

    return await this.dataSource.transaction(async (manager) => {
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

      this.logger.setUser({ id: user.id, email: user.email, role: user.role });
      this.logger.log('User created');

      const submission = submissionsRepository.create({
        user: { id: user.id },
      });
      await submissionsRepository.save(submission);

      this.logger.log('Survey submission created', { id: submission.id });

      const fileName = generateFileName({ name, mimeType, prefix: 'laudo' });
      const key = `${STORAGE_FOLDERS.patients.documents(user.id)}/${fileName}`;

      const data = await this.generateUploadUrlUseCase.execute({
        key,
        mimeType,
        fileSize,
        expiresInSeconds: 300,
        allowedMimeTypes: [...SURVEY_DOCUMENT_TYPES],
      });

      return {
        submissionId: submission.id,
        key,
        url: data.url,
        fields: data.fields,
      };
    });
  }
}
