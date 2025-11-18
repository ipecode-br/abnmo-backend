import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
}
