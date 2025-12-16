import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PATIENT_CONDITIONS, type PatientCondition } from '../enums/patients';
import { REFERRAL_STATUSES, type ReferralStatus } from '../enums/referrals';
import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import { ReferralSchema } from '../schemas/referral';
import { Patient } from './patient';

@Entity('referrals')
export class Referral implements ReferralSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'enum', enum: REFERRAL_STATUSES, default: 'scheduled' })
  status: ReferralStatus;

  @Column({ type: 'enum', enum: SPECIALTY_CATEGORIES })
  category: SpecialtyCategory;

  @Column({ type: 'enum', enum: PATIENT_CONDITIONS })
  condition: PatientCondition;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  annotation: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  professional_name: string | null;

  @Column('uuid')
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
