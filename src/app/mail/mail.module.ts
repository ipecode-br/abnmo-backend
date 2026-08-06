import { Module } from '@nestjs/common';

import { EnqueueEmailUseCase } from './use-cases/enqueue-email.use-case';

@Module({ providers: [EnqueueEmailUseCase], exports: [EnqueueEmailUseCase] })
export class MailModule {}
