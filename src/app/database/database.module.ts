import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getTypeOrmConfig } from '@/config/typeorm';
import { EnvService } from '@/env/env.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => getTypeOrmConfig(env),
    }),
  ],
})
export class DatabaseModule {}
