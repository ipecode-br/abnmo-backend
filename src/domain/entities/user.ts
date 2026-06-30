import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { SPECIALTY_CATEGORIES, type SpecialtyCategory } from '../enums/shared';
import {
  USER_ROLES,
  USER_STATUSES,
  type UserFeature,
  type UserRole,
  type UserStatus,
} from '../enums/users';
import type { SupportContact } from '../schemas/shared';
import type { UserSchema } from '../schemas/users';
import { Appointment } from './appointment';
import { BaseEntity } from './base';
import { Referral } from './referral';
import { Survey } from './survey';
import { SurveySubmission } from './survey-submission';

@Entity('users')
export class User extends BaseEntity implements UserSchema {
  @Column({ type: 'varchar', length: 64 })
  name: string;

  // Maximum email length is 254 characters.
  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 64 })
  password: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: USER_ROLES })
  role: UserRole;

  @Column({ type: 'json' })
  features: UserFeature[] = [];

  @Column({ type: 'enum', enum: USER_STATUSES, default: 'active' })
  status: UserStatus;

  @Column({ type: 'enum', enum: SPECIALTY_CATEGORIES, nullable: true })
  specialty: SpecialtyCategory | null;

  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  registrationId: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true, unique: true })
  cpf: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  susId: string | null;

  @Column({ type: 'json', nullable: true })
  supportContacts: SupportContact[] | null;

  @OneToOne(() => Survey, (survey) => survey.user)
  survey: Survey | null;

  @OneToOne(() => SurveySubmission, (submission) => submission.user)
  surveySubmission: SurveySubmission | null;

  @OneToMany(() => SurveySubmission, (submission) => submission.updatedBy)
  surveySubmissionsUpdated: SurveySubmission[];

  @OneToMany(() => Appointment, (appointment) => appointment.specialist)
  appointmentsAsSpecialist: Appointment[];

  @OneToMany(() => Referral, (referral) => referral.specialist)
  referralsAsSpecialist: Referral[];
}
