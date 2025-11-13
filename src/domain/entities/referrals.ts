import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PATIENT_CONDITION, PatientConditionType } from '../schemas/patient';
import {
  REFERRALS_CATEGORY,
  REFERRALS_STATUS,
  ReferralsCategoryType,
  ReferralsSchema,
  ReferralsStatusType,
} from '../schemas/referrals';
import { Patient } from './patient';

@Entity('referrals')
export class Referrals implements ReferralsSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: REFERRALS_CATEGORY })
  category: ReferralsCategoryType;

  @Column({ type: 'enum', enum: PATIENT_CONDITION })
  condition: PatientConditionType;

  @Column({ type: 'enum', enum: REFERRALS_STATUS, default: 'sheduled' })
  status: ReferralsStatusType;

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
