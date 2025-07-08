import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientSupport } from '@/domain/entities/patient-support';
import {
  createPatientSupportSchema,
  updatePatientSupportParamsSchema,
  updatePatientSupportSchema,
} from '@/domain/schemas/patient-support';

import {
  CreatePatientSupportDto,
  UpdatePatientSupportDto,
} from './dto/create-patient-support.dto';

@Injectable()
export class PatientSupportsService {
  constructor(
    @InjectRepository(PatientSupport)
    private readonly repo: Repository<PatientSupport>,
  ) {}

  async create(
    patientId: string,
    createDto: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    const parsed = createPatientSupportSchema.safeParse(createDto);
    if (!parsed.success) throw new BadRequestException(parsed.error.format());

    const patientSupportExists = await this.repo.findOne({
      where: { patient_id: patientId, name: createDto.name },
    });
    if (patientSupportExists) {
      throw new ConflictException('Apoio já cadastrado para esse paciente');
    }

    const entity = this.repo.create({
      patient_id: patientId,
      ...createDto,
    });
    return this.repo.save(entity);
  }

  async findAllByPatient(patientId: string): Promise<PatientSupport[]> {
    return this.repo.find({ where: { patient_id: patientId } });
  }

  async findById(id: string): Promise<PatientSupport> {
    const parse = updatePatientSupportParamsSchema.safeParse({ id });
    if (!parse.success) {
      throw new BadRequestException(parse.error.format());
    }
    const { id: validId } = parse.data;

    const support = await this.repo.findOneBy({ id: validId });
    if (!support) {
      throw new NotFoundException('Apoio não encontrado');
    }
    return support;
  }

  async update(
    id: string,
    updateDto: UpdatePatientSupportDto,
  ): Promise<PatientSupport> {
    await this.findById(id);

    const parsedDto = updatePatientSupportSchema.safeParse(updateDto);
    if (!parsedDto.success) {
      throw new BadRequestException(parsedDto.error.format());
    }

    const support = await this.repo.preload({ id, ...parsedDto.data });
    if (!support) {
      throw new NotFoundException('Apoio não encontrado');
    }
    return this.repo.save(support);
  }

  async remove(id: string): Promise<PatientSupport> {
    const support = await this.findById(id);
    return this.repo.remove(support);
  }
}
