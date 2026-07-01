import type { UserRole } from '@/domain/enums/users';

import { Feature } from './authorization/features';

export type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
  features: Feature[];
};

export type ContextUser = {
  id: string;
  email: string;
  role: UserRole;
};

type AppointmentsEvent =
  | 'cancel_appointment'
  | 'create_appointment'
  | 'update_appointment';

type AuthEvent =
  | 'change_password'
  | 'logout'
  | 'recover_password'
  | 'register_user'
  | 'reset_password'
  | 'sign_in';

type PatientRequirementsEvent =
  | 'approve_patient_requirement'
  | 'create_patient_requirement'
  | 'decline_patient_requirement';

type PatientSupportsEvent =
  | 'create_patient_support'
  | 'delete_patient_support'
  | 'update_patient_support';

type PatientsEvent = 'create_patient' | 'deactivate_patient' | 'update_patient';

type ReferralsEvent = 'cancel_referral' | 'create_referral' | 'update_referral';

type UsersEvent =
  | 'activate_user'
  | 'cancel_user_invite'
  | 'create_user_invite'
  | 'deactivate_user'
  | 'update_user';

type SurveyEvent =
  | 'init_survey'
  | 'complete_survey'
  | 'approve_survey'
  | 'reject_survey';

type StatusEvent = 'get_status';

export type ContextEvent =
  | AppointmentsEvent
  | AuthEvent
  | PatientRequirementsEvent
  | PatientSupportsEvent
  | PatientsEvent
  | ReferralsEvent
  | UsersEvent
  | SurveyEvent
  | StatusEvent;
