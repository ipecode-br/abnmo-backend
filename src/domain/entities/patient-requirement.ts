import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
  type PatientRequirementStatus,
  type PatientRequirementType,
} from '../enums/patient-requirements';
import type { PatientRequirementSchema } from '../schemas/patient-requirement';
import { Patient } from './patient';

@Entity('patient_requirements')
export class PatientRequirement implements PatientRequirementSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'enum', enum: PATIENT_REQUIREMENT_TYPES })
  type: PatientRequirementType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: PATIENT_REQUIREMENT_STATUSES,
    default: 'pending',
  })
  status: PatientRequirementStatus;

  @Column({ type: 'datetime', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  declined_by: string | null;

  @Column({ type: 'datetime', nullable: true })
  declined_at: Date | null;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.requirements)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
