import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AUTH_TOKENS, type AuthTokenType } from '../schemas/token';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'enum', enum: AUTH_TOKENS })
  type: AuthTokenType;

  @CreateDateColumn({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
