import { Column, Entity } from 'typeorm';

import {
  SURVEY_SUBMISSION_STATUSES,
  type SurveySubmissionStatus,
} from '../enums/survey';
import type { SurveySubmissionSchema } from '../schemas/survey';
import { BaseEntity } from './base';

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
  approvedBy: string | null;
}
