import { Reflector } from '@nestjs/core';

import type { AuthTokenRole } from '@/domain/enums/tokens';

export const Roles = Reflector.createDecorator<AuthTokenRole[]>();
