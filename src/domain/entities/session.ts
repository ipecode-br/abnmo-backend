import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base';
import { User } from './user';

@Entity('sessions')
export class Session extends BaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
