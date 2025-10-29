import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { PatientRequirementTypeList } from '@/domain/schemas/patient-requirement';
import { UserSchema } from '@/domain/schemas/user';

import { PatientsRepository } from '../patients/patients.repository';
import { FindAllPatientsRequirementsByIdDto } from './patient-requirement.dto';

export class PatientRequirementsRepository {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,

    private readonly patientsRepository: PatientsRepository,
  ) {}

  public async findById(id: string): Promise<PatientRequirement | null> {
    return await this.patientRequirementsRepository.findOne({ where: { id } });
  }

  public async approvedRequirement(
    id: string,
    approvedBy: string,
  ): Promise<PatientRequirement> {
    return this.patientRequirementsRepository.save({
      id,
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date(),
    });
  }

  async findAllPatientLogged(
    user: UserSchema,
    filters: FindAllPatientsRequirementsByIdDto,
  ): Promise<{ requests: PatientRequirementTypeList[]; total: number }> {
    const { status, startDate, endDate, page, perPage } = filters;

    const patient = await this.patientsRepository.findByUserId(user.id);
    const id = patient?.id;

    const query = this.patientRequirementsRepository
      .createQueryBuilder('patientRequirements')
      .where('patientRequirements.patient_id = :id', { id });

    if (status) {
      query.andWhere('patientRequirements.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere(
        'patientRequirements.created_at BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    if (startDate && !endDate) {
      query.andWhere('patientRequirements.created_at >= :startDate', {
        startDate,
      });
    }

    query.skip((page - 1) * perPage).take(perPage);

    const total = await query.getCount();
    const rawRequests = await query.getMany();

    const requests: PatientRequirementTypeList[] = rawRequests.map(
      ({ ...requestsData }) => ({
        id: requestsData.id,
        type: requestsData.type,
        title: requestsData.title,
        status: requestsData.status,
        submitted_at: requestsData.submitted_at,
        approved_at: requestsData.approved_at,
        created_at: requestsData.created_at,
      }),
    );

    return { requests, total };
  }
}
