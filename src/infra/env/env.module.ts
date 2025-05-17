import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EnvService } from './env.service';

@Module({
  imports: [ConfigModule],
  providers: [EnvService, ConfigService],
  exports: [EnvService],
})
export class EnvModule {}
