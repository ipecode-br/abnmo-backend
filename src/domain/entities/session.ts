import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import type { SessionSchema } from '../schemas/sessions';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('sessions')
export class Session extends BaseEntity implements SessionSchema {
  @Column({ type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
