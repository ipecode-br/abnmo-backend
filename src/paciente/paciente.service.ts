import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateDto } from 'src/common/utils/validation.util';
import { Repository } from 'typeorm';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Paciente } from './entities/paciente.entity';

@Injectable()
export class PacienteService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async create(createPacienteDto: CreatePacienteDto): Promise<Paciente> {
    await validateDto(createPacienteDto);

    const pacienteExistente = await this.pacienteRepository.findOne({
      where: { id_usuario: createPacienteDto.id_usuario },
    });

    if (pacienteExistente) {
      throw new BadRequestException(
        'Este usuário já possui um cadastro de paciente.',
      );
    }

    const paciente = this.pacienteRepository.create(createPacienteDto);
    return await this.pacienteRepository.save(paciente);
  }

  async findAll(): Promise<Paciente[]> {
    return await this.pacienteRepository.find();
  }

  async findOne(id: number): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id_usuario: id },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado.');
    }
    return paciente;
  }

  async update(
    id: number,
    updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    // 🔹 Valida os dados antes da atualização
    await validateDto(updatePacienteDto);

    const paciente = await this.findOne(id);

    if (!paciente) {
      throw new NotFoundException(`Paciente com ID ${id} não encontrado.`);
    }

    Object.assign(paciente, updatePacienteDto);

    return await this.pacienteRepository.save(paciente);
  }

  async remove(id: number): Promise<void> {
    const paciente = await this.findOne(id);
    await this.pacienteRepository.remove(paciente);
  }
}
