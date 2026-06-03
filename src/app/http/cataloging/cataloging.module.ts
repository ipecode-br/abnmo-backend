import { Module } from '@nestjs/common';

import { CatalogingController } from './cataloging.controller';

@Module({
  imports: [],
  controllers: [CatalogingController],
})
export class CatalogingModule {}
