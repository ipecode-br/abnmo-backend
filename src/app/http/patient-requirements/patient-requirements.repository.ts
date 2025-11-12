import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import {
  PatientRequirementByPatientIdResponseType,
  PatientRequirementListItemSchema,
} from '@/domain/schemas/patient-requirement';

import {
  CreatePatientRequirementDto,
  type FindAllPatientsRequirementsByPatientIdDto,
  FindAllPatientsRequirementsQueryDto,
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
    requirements: PatientRequirementByPatientIdResponseType[];
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
    const rawRequirements = await query.getMany();

    const requirements: PatientRequirementByPatientIdResponseType[] =
      rawRequirements.map((requirement) => ({
        id: requirement.id,
        type: requirement.type,
        title: requirement.title,
        status: requirement.status,
        submitted_at: requirement.submitted_at,
        approved_at: requirement.approved_at,
        created_at: requirement.created_at,
      }));

    return { requirements, total };
  }

  async findAllByPatientLogged(
    patientId: string,
    filters: FindAllPatientsRequirementsByPatientIdDto,
  ): Promise<{
    requirements: PatientRequirementByPatientIdResponseType[];
    total: number;
  }> {
    const { status, startDate, endDate, page, perPage } = filters;

    const query = this.patientRequirementsRepository
      .createQueryBuilder('patientRequirements')
      .where('patientRequirements.patient_id = :id', { id: patientId });

    if (status) {
      query.andWhere('patientRequirements.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere(
        'patientRequirements.created_at BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    if (startDate && !endDate) {
      query.andWhere('patientRequirements.created_at >= :startDate', {
        startDate,
      });
    }

    query.skip((page - 1) * perPage).take(perPage);

    const total = await query.getCount();
    const rawRequirements = await query.getMany();

    const requirements: PatientRequirementByPatientIdResponseType[] =
      rawRequirements.map((requirement) => ({
        id: requirement.id,
        type: requirement.type,
        title: requirement.title,
        status: requirement.status,
        submitted_at: requirement.submitted_at,
        approved_at: requirement.approved_at,
        created_at: requirement.created_at,
      }));

    return { requirements, total };
  }

  public async findAll(filters: FindAllPatientsRequirementsQueryDto): Promise<{
    requirements: PatientRequirementListItemSchema[];
    total: number;
  }> {
    const { status, startDate, endDate, page, perPage } = filters;

    const query = this.patientRequirementsRepository
      .createQueryBuilder('requirement')
      .leftJoinAndSelect('requirement.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .select([
        'requirement.id',
        'requirement.type',
        'requirement.title',
        'requirement.status',
        'requirement.submitted_at',
        'requirement.approved_at',
        'requirement.created_at',
        'patient.id',
        'user.name',
      ]);

    if (status) {
      query.andWhere('requirement.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('requirement.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (startDate && !endDate) {
      query.andWhere('requirement.created_at >= :startDate', {
        startDate,
      });
    }

    query.orderBy('requirement.created_at', 'DESC');

    const total = await query.getCount();

    query.skip((page - 1) * perPage).take(perPage);

    const rawRequirements = await query.getMany();

    const requirements = rawRequirements.map((requirement) => ({
      id: requirement.id,
      type: requirement.type,
      title: requirement.title,
      status: requirement.status,
      submitted_at: requirement.submitted_at,
      approved_at: requirement.approved_at,
      created_at: requirement.created_at,
      patient: {
        id: requirement.patient.id,
        name: requirement.patient.user.name,
      },
    }));

    return { requirements, total };
  }
}
