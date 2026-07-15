import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TOKENS_ENUM, type TokenType } from '../enums/tokens';
import type { TokenSchema } from '../schemas/tokens';

@Entity('tokens')
export class Token implements TokenSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  email: string | null;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'enum', enum: TOKENS_ENUM })
  type: TokenType;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
