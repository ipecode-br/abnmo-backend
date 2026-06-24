import { Column, Entity } from 'typeorm';

import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import {
  USER_ROLES,
  USER_STATUSES,
  type UserFeature,
  type UserRole,
  type UserStatus,
} from '../enums/users';
import type { UserSchema } from '../schemas/users';
import { BaseEntity } from './base';

@Entity('users')
export class User extends BaseEntity implements UserSchema {
  @Column({ type: 'varchar', length: 64 })
  name: string;

  // Maximum email length is 254 characters.
  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 64 })
  password: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: USER_ROLES })
  role: UserRole;

  @Column({ type: 'json' })
  features: UserFeature[] = [];

  @Column({ type: 'enum', enum: USER_STATUSES, default: 'active' })
  status: UserStatus;

  @Column({ type: 'enum', enum: SPECIALTY_CATEGORIES, nullable: true })
  specialty: SpecialtyCategory | null;

  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  registrationId: string | null;
}
