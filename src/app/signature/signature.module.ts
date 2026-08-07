import { Module } from '@nestjs/common';

import { SignatureService } from './signature.service';
import { RequestSignatureUseCase } from './use-cases/request-signature.use-case';
import { SendReminderSignatureUseCase } from './use-cases/send-reminder-signature.use-case';

@Module({
  providers: [
    SignatureService,
    RequestSignatureUseCase,
    SendReminderSignatureUseCase,
  ],
  exports: [
    RequestSignatureUseCase,
    SendReminderSignatureUseCase,
    SignatureService,
  ],
})
export class SignatureModule {}
