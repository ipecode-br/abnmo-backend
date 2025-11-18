import { Appointment } from './appointment';
import { Patient } from './patient';
import { PatientRequirement } from './patient-requirement';
import { PatientSupport } from './patient-support';
import { Referral } from './referral';
import { Specialist } from './specialist';
import { Token } from './token';
import { User } from './user';

export const DATABASE_ENTITIES = [
  User,
  Token,
  Patient,
  PatientSupport,
  Appointment,
  Specialist,
  PatientRequirement,
  Referral,
];
