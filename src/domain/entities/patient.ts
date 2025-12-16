import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  BRAZILIAN_STATES,
  type BrazilianState,
} from '@/constants/brazilian-states';

import {
  PATIENT_GENDERS,
  PATIENT_STATUSES,
  type PatientGender,
  type PatientStatus,
} from '../enums/patients';
import type { PatientSchema } from '../schemas/patient';
import { Appointment } from './appointment';
import { PatientRequirement } from './patient-requirement';
import { PatientSupport } from './patient-support';
import { Referral } from './referral';

@Entity('patients')
export class Patient implements PatientSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'enum', enum: PATIENT_STATUSES, default: 'pending' })
  status: PatientStatus;

  @Column({ type: 'enum', enum: PATIENT_GENDERS, default: 'prefer_not_to_say' })
  gender: PatientGender;

  @Column({ type: 'timestamp', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 11, unique: true, nullable: true })
  cpf: string | null;

  @Column({ type: 'enum', enum: BRAZILIAN_STATES, nullable: true })
  state: BrazilianState | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  has_disability: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  disability_desc: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  need_legal_assistance: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  take_medication: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  medication_desc: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  has_nmo_diagnosis: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => PatientSupport, (support) => support.patient)
  supports: PatientSupport[];

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => Referral, (referral) => referral.patient)
  referrals: Referral[];

  @OneToMany(() => PatientRequirement, (requirement) => requirement.patient)
  requirements: PatientRequirement[];
}
