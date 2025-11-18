import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ReferralsService } from './referrals.service';

@ApiTags('Encaminhamentos')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}
}
