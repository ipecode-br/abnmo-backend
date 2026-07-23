import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { PATIENT_CONDITIONS, type PatientCondition } from '../enums/patients';
import { REFERRAL_STATUSES, type ReferralStatus } from '../enums/referrals';
import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import type { ReferralSchema } from '../schemas/referrals';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('referrals')
export class Referral extends BaseEntity implements ReferralSchema {
  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'enum', enum: REFERRAL_STATUSES, default: 'scheduled' })
  status: ReferralStatus;

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
