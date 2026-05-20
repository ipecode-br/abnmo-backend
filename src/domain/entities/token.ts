import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AUTH_TOKENS, type AuthTokenType } from '../enums/tokens';
import type { AuthToken } from '../schemas/tokens';

@Entity('tokens')
export class Token implements AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  email: string | null;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'enum', enum: AUTH_TOKENS })
  type: AuthTokenType;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
