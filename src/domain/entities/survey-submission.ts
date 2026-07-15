import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import {
  SURVEY_SUBMISSION_STATUSES,
  SurveySubmissionStatus,
} from '../enums/survey-submissions';
import { BaseEntity } from './base';
import { Document } from './document';
import { User } from './user';

@Entity('survey_submissions')
export class SurveySubmission extends BaseEntity {
  @Column({
    type: 'enum',
    enum: SURVEY_SUBMISSION_STATUSES,
    default: 'pending_document',
  })
  status: SurveySubmissionStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  surveyToken: string | null;

  @OneToOne(() => User, (user) => user.surveySubmission)
  @JoinColumn()
  user: User;

  @OneToOne(() => Document, (document) => document.submission)
  document: Document | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;
}
