import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PATIENT_CONDITIONS, PatientConditionType } from '../schemas/patient';
import {
  REFERRAL_CATEGORIES,
  REFERRAL_STATUSES,
  ReferralCategoryType,
  ReferralSchema,
  ReferralStatusType,
} from '../schemas/referral';
import { Patient } from './patient';

@Entity('referrals')
export class Referral implements ReferralSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: REFERRAL_CATEGORIES })
  category: ReferralCategoryType;

  @Column({ type: 'enum', enum: PATIENT_CONDITIONS })
  condition: PatientConditionType;

  @Column({ type: 'enum', enum: REFERRAL_STATUSES, default: 'scheduled' })
  status: ReferralStatusType;

  @Column({ type: 'varchar', length: 500, nullable: true })
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
