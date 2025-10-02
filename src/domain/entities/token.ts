import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  AUTH_TOKENS,
  type AuthTokenSchema,
  type AuthTokenType,
} from '../schemas/token';

@Entity('tokens')
export class Token implements AuthTokenSchema {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'enum', enum: AUTH_TOKENS })
  type: AuthTokenType;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
