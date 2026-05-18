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
  patientId: string;

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
  professionalName: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn()
  patient: Patient;
}
