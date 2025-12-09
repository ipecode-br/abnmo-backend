import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { REFERRAL_STATUSES, type ReferralStatus } from '../enums/referrals';
import {
  SPECIALTY_CATEGORIES,
  type SpecialtyCategory,
} from '../enums/specialties';
import { PATIENT_CONDITIONS, PatientCondition } from '../schemas/patient';
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

  @Column({ type: 'enum', enum: SPECIALTY_CATEGORIES })
  category: SpecialtyCategory;

  @Column({ type: 'enum', enum: PATIENT_CONDITIONS })
  condition: PatientCondition;

  @Column({ type: 'enum', enum: REFERRAL_STATUSES, default: 'scheduled' })
  status: ReferralStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  annotation: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referred_to: string | null;

  @Column({ type: 'uuid' })
  referred_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.referrals)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
