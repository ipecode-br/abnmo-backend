import { Column, Entity, Index } from 'typeorm';

import { TOKENS_ENUM, type TokenType } from '../enums/tokens';
import type { TokenSchema } from '../schemas/tokens';
import { BaseEntity } from './base';

@Entity('tokens')
export class Token extends BaseEntity implements TokenSchema {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  email: string | null;

  @Index()
  @Column({ type: 'varchar', length: 254, unique: true })
  token: string;

  @Column({ type: 'enum', enum: TOKENS_ENUM })
  type: TokenType;

  @Column({ type: 'datetime' })
  expiresAt: Date;
}
