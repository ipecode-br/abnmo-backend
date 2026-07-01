import { Module } from '@nestjs/common';

import { EnvModule } from '@/env/env.module';

import { SignatureService } from './signature.service';
import { RequestSignatureUseCase } from './use-cases/request-signature.use-case';

@Module({
  imports: [EnvModule],
  providers: [SignatureService, RequestSignatureUseCase],
  exports: [RequestSignatureUseCase],
})
export class SignatureModule {}
