import { Reflector } from '@nestjs/core';

import { AllowedRole } from '@/domain/enums/roles';

export const Roles = Reflector.createDecorator<AllowedRole[]>();
