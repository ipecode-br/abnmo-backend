import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AUTH_TOKENS, type AuthTokenType } from '../enums/tokens';
import type { AuthToken } from '../schemas/tokens';

@Entity('tokens')
export class Token implements AuthToken {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'enum', enum: AUTH_TOKENS })
  type: AuthTokenType;

  @CreateDateColumn({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
