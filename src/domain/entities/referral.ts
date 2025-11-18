import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PATIENT_CONDITION, PatientCondition } from '../schemas/patient';
import {
  REFERRAL_CATEGORY,
  REFERRAL_STATUS,
  ReferralCategory,
  ReferralSchema,
  ReferralStatus,
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

  @Column({ type: 'enum', enum: REFERRAL_CATEGORY })
  category: ReferralCategory;

  @Column({ type: 'enum', enum: PATIENT_CONDITION })
  condition: PatientCondition;

  @Column({ type: 'enum', enum: REFERRAL_STATUS, default: 'scheduled' })
  status: ReferralStatus;

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
