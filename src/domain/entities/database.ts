import { Appointment } from './appointment';
import { Document } from './document';
import { PatientRequirement } from './patient-requirement';
import { Referral } from './referral';
import { Session } from './session';
import { Survey } from './survey';
import { SurveySubmission } from './survey-submission';
import { Token } from './token';
import { User } from './user';
import { WebhookEvent } from './webhook-event';

export const DATABASE_ENTITIES = [
  Appointment,
  Document,
  PatientRequirement,
  Referral,
  Session,
  Survey,
  SurveySubmission,
  Token,
  User,
  WebhookEvent,
];
