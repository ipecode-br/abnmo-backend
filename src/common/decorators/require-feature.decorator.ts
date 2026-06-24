import { Reflector } from '@nestjs/core';

import { Feature } from '@/domain/enums/shared';

export const RequireFeature = Reflector.createDecorator<Feature>();
