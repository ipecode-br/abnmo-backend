import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';

export class PatientsRequirementRepository {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementRepository: Repository<PatientRequirement>,
  ) {}

  public async findById(id: string): Promise<PatientRequirement | null> {
    return await this.patientRequirementRepository.findOne({ where: { id } });
  }

  public async approvedRequirement(
    id: string,
    approvedBy: string,
  ): Promise<PatientRequirement> {
    return this.patientRequirementRepository.save({
      id,
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date(),
    });
  }
}
