import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

import {
  SURVEY_SUBMISSION_STATUSES,
  type SurveySubmissionStatus,
} from '../enums/survey-submissions';
import type { SurveySubmissionSchema } from '../schemas/surveys/submissions';
import { BaseEntity } from './base';
import { Document } from './document';
import { User } from './user';

@Entity('survey_submissions')
export class SurveySubmission
  extends BaseEntity
  implements SurveySubmissionSchema
{
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
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @OneToOne(() => Document, (document) => document.submission)
  document: Document | null;

  @Column('uuid', { nullable: true })
  updatedBy: string | null;
}
