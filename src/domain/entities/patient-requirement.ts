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
  PATIENT_REQUIREMENT_STATUS,
  PATIENT_REQUIREMENT_TYPE,
  PatientRequirementSchema,
  PatientRequirementStatusType,
  PatientRequirementType,
} from '../schemas/patient-requirement';
import { Patient } from './patient';

@Entity('patients-requirement')
export class PatientRequirement implements PatientRequirementSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({
    type: 'enum',
    enum: PATIENT_REQUIREMENT_TYPE,
    default: 'document',
  })
  type: PatientRequirementType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({
    type: 'enum',
    enum: PATIENT_REQUIREMENT_STATUS,
    default: 'pending',
  })
  status: PatientRequirementStatusType;

  @Column({ type: 'uuid' })
  required_by: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.requirements)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
