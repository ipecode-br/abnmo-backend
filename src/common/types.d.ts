import type { AuthTokenRole } from '@/domain/enums/tokens';

export type AuthUser = {
  id: string;
  email: string;
  role: AuthTokenRole;
};

type AppointmentsEvent =
  | 'cancel_appointment'
  | 'create_appointment'
  | 'update_appointment';

type AuthEvent =
  | 'change_password'
  | 'logout'
  | 'recover_password'
  | 'refresh_token'
  | 'register_patient'
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

type NotificationsEvent =
  | 'create_notification'
  | 'mark_notification_as_read'
  | 'mark_all_notifications_as_read';

type UsersEvent =
  | 'activate_user'
  | 'cancel_user_invite'
  | 'create_user_invite'
  | 'deactivate_user'
  | 'update_user';

export type ContextEvent =
  | AppointmentsEvent
  | AuthEvent
  | NotificationsEvent
  | PatientRequirementsEvent
  | PatientSupportsEvent
  | PatientsEvent
  | ReferralsEvent
  | UsersEvent;
