import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';

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
import { BaseEntity } from './base';
import { Document } from './document';
import { Survey } from './survey';
import { SurveySubmission } from './survey-submission';

@Entity('users')
export class User extends BaseEntity implements UserSchema {
  @Index()
  @Column({ type: 'varchar', length: 64 })
  name: string;

  // Maximum email length is 254 characters.
  @Index()
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

  @OneToMany(() => Document, (document) => document.user)
  documents: Document[];

  @OneToOne(() => SurveySubmission, (submission) => submission.patient, {
    onDelete: 'SET NULL',
  })
  surveySubmission: SurveySubmission | null;

  @OneToOne(() => Survey, (survey) => survey.patient, { onDelete: 'SET NULL' })
  survey: Survey | null;
}
