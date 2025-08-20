import { Injectable, Logger } from '@nestjs/common';

import { SpecialistsRepository } from './specialists.repository';

@Injectable()
export class SpecialistsService {
  private readonly logger = new Logger(SpecialistsService.name);

  constructor(private readonly specialistsRepository: SpecialistsRepository) {}
}
