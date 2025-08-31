import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { testTypeOrmConfig } from '@/config/typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(testTypeOrmConfig())],
  exports: [TypeOrmModule],
})
export class TestDatabaseModule {}
