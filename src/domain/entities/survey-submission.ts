import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import {
  SURVEY_SUBMISSION_STATUSES,
  SurveySubmissionStatus,
} from '../enums/survey-submissions';
import { SurveySubmissionSchema } from '../schemas/surveys/submissions';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('survey_submissions')
export class SurveySubmission
  extends BaseEntity
  implements SurveySubmissionSchema
{
  @Column({ type: 'varchar', length: 64 })
  name: string;

  // Maximum email length is 254 characters.
  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 11 })
  phone: string;

  @Column({
    type: 'enum',
    enum: SURVEY_SUBMISSION_STATUSES,
    default: 'pending',
  })
  status: SurveySubmissionStatus;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn()
  approvedBy: User | null;
}
