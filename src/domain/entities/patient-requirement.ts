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
  patientId: string;

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
  submittedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  declinedBy: string | null;

  @Column({ type: 'datetime', nullable: true })
  declinedAt: Date | null;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Patient, (patient) => patient.requirements)
  @JoinColumn()
  patient: Patient;
}
