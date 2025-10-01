import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';

import {
  SPECIALIST_STATUS,
  SpecialistSchema,
  SpecialistStatusType,
} from '../schemas/specialist';
import { User } from './user';

@Entity('specialists')
export class Specialist implements SpecialistSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  specialty: string;

  @Column({ type: 'varchar', length: 255 })
  registry: string;

  @Column({ type: 'enum', enum: SPECIALIST_STATUS, default: 'active' })
  status: SpecialistStatusType;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Appointment, (appointment) => appointment.specialist)
  appointments: Appointment[];
}
