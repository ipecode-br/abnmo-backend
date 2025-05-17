import { Module } from '@nestjs/common';
import { EnvService } from './env.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EnvService, ConfigService],
  exports: [EnvService],
})
export class EnvModule {}
