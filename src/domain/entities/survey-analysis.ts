import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import {
  SURVEY_ANALYSIS_QUESTION_KEYS,
  type SurveyAnalysisQuestionKey,
} from '../enums/survey-analysis';
import type {
  SurveyAnalysisSchema,
  SurveyAnalysisTerm,
} from '../schemas/surveys/analysis';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('survey_analyses')
@Unique('UQ_survey_analyses_patient_question', ['patient', 'questionKey'])
export class SurveyAnalysis extends BaseEntity implements SurveyAnalysisSchema {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @Column({ type: 'enum', enum: SURVEY_ANALYSIS_QUESTION_KEYS })
  questionKey: SurveyAnalysisQuestionKey;

  @Column({ type: 'varchar', length: 500 })
  question: string;

  @Column({ type: 'text' })
  rawResponse: string;

  @Column({ type: 'jsonb' })
  terms: SurveyAnalysisTerm[];

  @Column({ type: 'varchar', length: 16 })
  promptVersion: string;

  @Column({ type: 'varchar', length: 32 })
  model: string;
}
