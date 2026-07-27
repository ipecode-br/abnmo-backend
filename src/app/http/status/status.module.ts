import { Module } from '@nestjs/common';

import { SignatureModule } from '@/app/signature/signature.module';

import { StatusController } from './status.controller';
import { GetStatusUseCase } from './use-cases/get-status.use-case';

@Module({
  imports: [SignatureModule],
  controllers: [StatusController],
  providers: [GetStatusUseCase],
})
export class StatusModule {}
