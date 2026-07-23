import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import {
  APPOINTMENT_STATUSES,
  type AppointmentStatus,
} from '../enums/appointments';
import { PATIENT_CONDITIONS, type PatientCondition } from '../enums/patients';
import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import type { AppointmentSchema } from '../schemas/appointments';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('appointments')
export class Appointment extends BaseEntity implements AppointmentSchema {
  @Column({ type: 'timestamp' })
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

  @Column('uuid')
  createdBy: string;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Index()
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'specialistId' })
  specialist: User | null;
}
