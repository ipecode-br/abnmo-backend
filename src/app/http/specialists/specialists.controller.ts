import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SpecialistsService } from './specialists.service';

@ApiTags('Especialistas')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}
}
