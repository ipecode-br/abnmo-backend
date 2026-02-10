import { createZodDto } from 'nestjs-zod';

import {
  getTotalAppointmentsByCategoryQuerySchema,
  getTotalAppointmentsQuerySchema,
  getTotalPatientsByFieldQuerySchema,
  getTotalPatientsWithAppointmentsByStateQuerySchema,
  getTotalPatientsWithAppointmentsQuerySchema,
  getTotalPatientsWithReferralsByStateQuerySchema,
  getTotalPatientsWithReferralsQuerySchema,
  getTotalReferralsByCategoryQuerySchema,
  getTotalReferralsQuerySchema,
} from '@/domain/schemas/statistics/requests';
import {
  getTotalAppointmentsByCategoryResponseSchema,
  getTotalAppointmentsResponseSchema,
  getTotalPatientsByCityResponseSchema,
  getTotalPatientsByGenderResponseSchema,
  getTotalPatientsResponseSchema,
  getTotalPatientsWithAppointmentsByStateResponseSchema,
  getTotalPatientsWithAppointmentsResponseSchema,
  getTotalPatientsWithReferralsByStateResponseSchema,
  getTotalPatientsWithReferralsResponseSchema,
  getTotalReferralsByCategoryResponseSchema,
  getTotalReferralsResponseSchema,
} from '@/domain/schemas/statistics/responses';

// Appointments

export class GetTotalAppointmentsQuery extends createZodDto(
  getTotalAppointmentsQuerySchema,
) {}
export class GetTotalAppointmentsResponse extends createZodDto(
  getTotalAppointmentsResponseSchema,
) {}

export class GetTotalAppointmentsByCategoryQuery extends createZodDto(
  getTotalAppointmentsByCategoryQuerySchema,
) {}
export class GetTotalAppointmentsByCategoryResponse extends createZodDto(
  getTotalAppointmentsByCategoryResponseSchema,
) {}

// Patients

export class GetTotalPatientsResponse extends createZodDto(
  getTotalPatientsResponseSchema,
) {}

export class GetTotalPatientsByFieldQuery extends createZodDto(
  getTotalPatientsByFieldQuerySchema,
) {}

export class GetTotalPatientsByCityResponse extends createZodDto(
  getTotalPatientsByCityResponseSchema,
) {}

export class GetTotalPatientsByGenderResponse extends createZodDto(
  getTotalPatientsByGenderResponseSchema,
) {}

export class GetTotalPatientsWithAppointmentsQuery extends createZodDto(
  getTotalPatientsWithAppointmentsQuerySchema,
) {}
export class GetTotalPatientsWithAppointmentsResponse extends createZodDto(
  getTotalPatientsWithAppointmentsResponseSchema,
) {}

export class GetTotalPatientsWithAppointmentsByStateQuery extends createZodDto(
  getTotalPatientsWithAppointmentsByStateQuerySchema,
) {}
export class GetTotalPatientsWithAppointmentsByStateResponse extends createZodDto(
  getTotalPatientsWithAppointmentsByStateResponseSchema,
) {}

export class GetTotalPatientsWithReferralsQuery extends createZodDto(
  getTotalPatientsWithReferralsQuerySchema,
) {}
export class GetTotalPatientsWithReferralsResponse extends createZodDto(
  getTotalPatientsWithReferralsResponseSchema,
) {}

export class GetTotalPatientsWithReferralsByStateQuery extends createZodDto(
  getTotalPatientsWithReferralsByStateQuerySchema,
) {}
export class GetTotalPatientsWithReferralsByStateResponse extends createZodDto(
  getTotalPatientsWithReferralsByStateResponseSchema,
) {}

// Referrals

export class GetTotalReferralsQuery extends createZodDto(
  getTotalReferralsQuerySchema,
) {}
export class GetTotalReferralsResponse extends createZodDto(
  getTotalReferralsResponseSchema,
) {}

export class GetTotalReferralsByCategoryQuery extends createZodDto(
  getTotalReferralsByCategoryQuerySchema,
) {}
export class GetTotalReferralsByCategoryResponse extends createZodDto(
  getTotalReferralsByCategoryResponseSchema,
) {}
