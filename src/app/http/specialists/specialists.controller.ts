import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SpecialistsService } from './specialists.service';

@ApiTags('Especialista')
@Controller('specialists')
export class SpecialistController {
  constructor(private readonly specialistService: SpecialistsService) {}
}
