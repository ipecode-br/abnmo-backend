import { createZodDto } from 'nestjs-zod';

import {
  getTotalAppointmentsQuerySchema,
  getTotalPatientsByFieldQuerySchema,
  getTotalReferralsByCategoryQuerySchema,
  getTotalReferralsQuerySchema,
  getTotalReferredPatientsByStateQuerySchema,
  getTotalReferredPatientsQuerySchema,
} from '@/domain/schemas/statistics/requests';
import {
  getTotalAppointmentsResponseSchema,
  getTotalPatientsByCityResponseSchema,
  getTotalPatientsByGenderResponseSchema,
  getTotalPatientsByStatusResponseSchema,
  getTotalReferralsByCategoryResponseSchema,
  getTotalReferralsResponseSchema,
  getTotalReferredPatientsByStateResponseSchema,
  getTotalReferredPatientsResponseSchema,
} from '@/domain/schemas/statistics/responses';

// Appointments

export class GetTotalAppointmentsQuery extends createZodDto(
  getTotalAppointmentsQuerySchema,
) {}
export class GetTotalAppointmentsResponse extends createZodDto(
  getTotalAppointmentsResponseSchema,
) {}

// Patients

export class GetTotalPatientsByStatusResponse extends createZodDto(
  getTotalPatientsByStatusResponseSchema,
) {}

export class GetTotalPatientsByGenderResponse extends createZodDto(
  getTotalPatientsByGenderResponseSchema,
) {}

export class GetTotalPatientsByCityResponse extends createZodDto(
  getTotalPatientsByCityResponseSchema,
) {}

export class GetTotalPatientsByFieldQuery extends createZodDto(
  getTotalPatientsByFieldQuerySchema,
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

export class GetTotalReferredPatientsQuery extends createZodDto(
  getTotalReferredPatientsQuerySchema,
) {}
export class GetTotalReferredPatientsResponse extends createZodDto(
  getTotalReferredPatientsResponseSchema,
) {}

export class GetTotalReferredPatientsByStateQuery extends createZodDto(
  getTotalReferredPatientsByStateQuerySchema,
) {}
export class GetTotalReferredPatientsByStateResponse extends createZodDto(
  getTotalReferredPatientsByStateResponseSchema,
) {}
