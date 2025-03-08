import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateDto } from 'src/common/utils/validation.util';
import { Repository } from 'typeorm';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';
import { UpdateDiagnosticoDto } from './dto/update-diagnostico.dto';
import { Diagnostico } from './entities/diagnostico.entity';

@Injectable()
export class DiagnosticoService {
  constructor(
    @InjectRepository(Diagnostico)
    private readonly diagnosticoRepository: Repository<Diagnostico>,
  ) {}

  async create(
    createDiagnosticoDto: CreateDiagnosticoDto,
  ): Promise<Diagnostico> {
    await validateDto(createDiagnosticoDto);

    const diagnosticoExistente = await this.diagnosticoRepository.findOne({
      where: { desc_diagnostico: createDiagnosticoDto.desc_diagnostico },
    });

    if (diagnosticoExistente) {
      throw new BadRequestException(
        'Já existe um diagnóstico com essa descrição.',
      );
    }

    // Busca o maior id_diagnostico e incrementa 1
    const ultimoDiagnostico: { maxId: number } | null | undefined =
      await this.diagnosticoRepository
        .createQueryBuilder()
        .select('MAX(id_diagnostico)', 'maxId')
        .getRawOne();

    const maxId: number = ultimoDiagnostico?.maxId
      ? Number(ultimoDiagnostico.maxId)
      : 0;
    const novoId = maxId + 1;

    const diagnostico = this.diagnosticoRepository.create({
      id_diagnostico: novoId,
      desc_diagnostico: createDiagnosticoDto.desc_diagnostico,
    });

    return await this.diagnosticoRepository.save(diagnostico);
  }

  async findAll(): Promise<Diagnostico[]> {
    return await this.diagnosticoRepository.find();
  }

  async findOne(id: number): Promise<Diagnostico> {
    const diagnostico = await this.diagnosticoRepository.findOne({
      where: { id_diagnostico: id },
    });
    if (!diagnostico) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }
    return diagnostico;
  }

  async update(
    id: number,
    updateDiagnosticoDto: UpdateDiagnosticoDto,
  ): Promise<Diagnostico> {
    await validateDto(updateDiagnosticoDto);

    const diagnostico = await this.findOne(id);
    Object.assign(diagnostico, updateDiagnosticoDto);

    return await this.diagnosticoRepository.save(diagnostico);
  }

  async remove(id: number): Promise<void> {
    const diagnostico = await this.findOne(id);
    await this.diagnosticoRepository.remove(diagnostico);
  }
}
