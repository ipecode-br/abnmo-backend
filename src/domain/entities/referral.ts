import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { PATIENT_CONDITIONS, type PatientCondition } from '../enums/patients';
import { REFERRAL_STATUSES, type ReferralStatus } from '../enums/referrals';
import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import { ReferralSchema } from '../schemas/referrals';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('referrals')
export class Referral extends BaseEntity implements ReferralSchema {
  @Column({ type: 'datetime' })
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
  professionalName: string | null;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn()
  patient: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  specialist: User | null;
}
