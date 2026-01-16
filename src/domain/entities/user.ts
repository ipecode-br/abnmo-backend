import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from '../enums/users';
import type { UserSchema } from '../schemas/users';

@Entity('users')
export class User implements UserSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'enum', enum: USER_ROLES })
  role: UserRole;

  @Column({ type: 'enum', enum: USER_STATUSES, default: 'active' })
  status: UserStatus;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
