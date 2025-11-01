import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { PatientRequirementByPatientIdResponseType } from '@/domain/schemas/patient-requirement';

import {
  CreatePatientRequirementDto,
  type FindAllPatientsRequirementsByPatientIdDto,
} from './patient-requirements.dtos';

export class PatientRequirementsRepository {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
  ) {}

  public async findById(id: string): Promise<PatientRequirement | null> {
    return await this.patientRequirementsRepository.findOne({ where: { id } });
  }

  public async create(
    createPatientRequirementDto: CreatePatientRequirementDto & {
      required_by: string;
    },
  ): Promise<PatientRequirement> {
    const requirementCreated = this.patientRequirementsRepository.create(
      createPatientRequirementDto,
    );
    return await this.patientRequirementsRepository.save(requirementCreated);
  }

  public async approve(
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

  public async decline(
    id: string,
    declinedBy: string,
  ): Promise<PatientRequirement> {
    return this.patientRequirementsRepository.save({
      id,
      status: 'declined',
      approved_by: declinedBy,
      approved_at: new Date(),
    });
  }

  public async findAllByPatientId(
    id: string,
    filters: FindAllPatientsRequirementsByPatientIdDto,
  ): Promise<{
    requests: PatientRequirementByPatientIdResponseType[];
    total: number;
  }> {
    const { status, startDate, endDate, page, perPage } = filters;

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

    const requests: PatientRequirementByPatientIdResponseType[] =
      rawRequests.map(({ ...requestsData }) => ({
        id: requestsData.id,
        type: requestsData.type,
        title: requestsData.title,
        status: requestsData.status,
        submitted_at: requestsData.submitted_at,
        approved_at: requestsData.approved_at,
        created_at: requestsData.created_at,
      }));

    return { requests, total };
  }
}
