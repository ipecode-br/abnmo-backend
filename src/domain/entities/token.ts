import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AUTH_TOKENS, type AuthTokenKey } from '../enums/tokens';
import type { AuthToken } from '../schemas/tokens';

@Entity('tokens')
export class Token implements AuthToken {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'enum', enum: AUTH_TOKENS })
  type: AuthTokenKey;

  @CreateDateColumn({ type: 'datetime', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
