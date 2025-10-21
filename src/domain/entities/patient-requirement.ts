import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  PatientRequirementSchema,
  STATUS_REQUIREMENT,
  StatusRequirement,
  TYPE_REQUIREMENT,
  TypeRequirement,
} from '../schemas/patient-requirement';
import { Patient } from './patient';
import { User } from './user';

@Entity('patients-requirement')
export class PatientRequirement implements PatientRequirementSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({
    type: 'enum',
    enum: TYPE_REQUIREMENT,
    nullable: false,
    default: 'document',
  })
  type: TypeRequirement;

  @Column({ type: 'varchar', length: 250, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: STATUS_REQUIREMENT,
    nullable: false,
    default: 'pending',
  })
  status: StatusRequirement;

  @Column('uuid')
  required_by: string;

  @Column('uuid')
  approved_by: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  submitted_at: Date;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
