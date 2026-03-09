import type { AuthTokenRole } from '@/domain/enums/tokens';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthTokenRole;
}
