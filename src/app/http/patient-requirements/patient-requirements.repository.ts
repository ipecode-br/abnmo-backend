import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';

import { CreatePatientRequirementDto } from './patient-requirements.dtos';

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

  public async declinedRequirement(
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
}
