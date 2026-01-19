import { Reflector } from '@nestjs/core';

import type { AllowedRole } from '@/domain/enums/tokens';

export const Roles = Reflector.createDecorator<AllowedRole[]>();
