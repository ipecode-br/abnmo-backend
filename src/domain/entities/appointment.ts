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
  APPOINTMENT_STATUSES,
  type AppointmentStatus,
} from '../enums/appointments';
import { PATIENT_CONDITIONS, type PatientCondition } from '../enums/patients';
import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import type { AppointmentSchema } from '../schemas/appointments';
import { Patient } from './patient';

@Entity('appointments')
export class Appointment implements AppointmentSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'enum', enum: APPOINTMENT_STATUSES, default: 'scheduled' })
  status: AppointmentStatus;

  @Column({ type: 'enum', enum: SPECIALTY_CATEGORIES })
  category: SpecialtyCategory;

  @Column({ type: 'enum', enum: PATIENT_CONDITIONS })
  condition: PatientCondition;

  @Column({ type: 'varchar', length: 500, nullable: true })
  annotation: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  professional_name: string | null;

  @Column('uuid')
  created_by: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
