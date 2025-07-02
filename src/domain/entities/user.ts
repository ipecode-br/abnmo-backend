import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  USER_ROLES,
  type UserRoleType,
  type UserSchema,
} from '../schemas/user';

@Entity('users')
export class User implements UserSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: USER_ROLES, default: 'patient' })
  role: UserRoleType;

  @Column({ type: 'varchar', length: 255, default: null })
  avatar_url: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
