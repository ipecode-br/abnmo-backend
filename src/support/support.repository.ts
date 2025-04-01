import { Injectable } from '@nestjs/common';
import { Support } from './entities/support.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSupportDto } from './dto/create-support.dto';

@Injectable()
export class SupportRepository {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
  ) {}

  public async findAll(): Promise<Support[]> {
    const supports = await this.supportRepository.find({
      relations: ['pacientes'],
    });

    return supports;
  }

  public async findById(id: number): Promise<Support | null> {
    const support = await this.supportRepository.findOne({
      where: {
        id_apoio: id,
      },
      relations: ['pacientes'],
    });

    return support;
  }

  public async findByName(
    name: string,
    whatsapp: string,
  ): Promise<Support | null> {
    const support = await this.supportRepository.findOne({
      where: {
        nome_apoio: name,
        whatsapp,
      },
      relations: ['pacientes'],
    });

    return support;
  }

  public async create(support: CreateSupportDto): Promise<Support> {
    const supportCreated = this.supportRepository.create(support);

    const supportSaved = await this.supportRepository.save(supportCreated);

    return supportSaved;
  }

  public async update(support: Support): Promise<Support> {
    const supportUpdated = await this.supportRepository.save(support);

    return supportUpdated;
  }

  public async remove(support: Support): Promise<Support> {
    const supportDeleted = await this.supportRepository.remove(support);

    return supportDeleted;
  }
}
