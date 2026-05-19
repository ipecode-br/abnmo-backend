import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getTypeOrmConfig } from '@/config/typeorm.config';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => getTypeOrmConfig(env),
    }),
  ],
})
export class DatabaseModule {}
