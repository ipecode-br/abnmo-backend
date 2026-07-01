import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import {
  SURVEY_SUBMISSION_STATUSES,
  SurveySubmissionStatus,
} from '../enums/survey-submissions';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('survey_submissions')
export class SurveySubmission extends BaseEntity {
  @Column({
    type: 'enum',
    enum: SURVEY_SUBMISSION_STATUSES,
    default: 'pending_document',
  })
  status: SurveySubmissionStatus;

  @Column({ type: 'varchar', length: 512, nullable: true })
  documentKey: string | null;

  @OneToOne(() => User, (user) => user.surveySubmission)
  @JoinColumn()
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;
}
