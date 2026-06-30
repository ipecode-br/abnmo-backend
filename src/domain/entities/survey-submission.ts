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
    default: 'pending',
  })
  status: SurveySubmissionStatus;

  @OneToOne(() => User, (user) => user.surveySubmission)
  @JoinColumn()
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn()
  approvedBy: User | null;
}
