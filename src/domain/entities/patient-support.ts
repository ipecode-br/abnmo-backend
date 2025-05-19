import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Patient } from '@/domain/entities/patient';

@Entity('apoios')
export class PatientSupport {
  @ApiProperty({
    example: 1,
    description: 'Identificador único do apoio',
  })
  @PrimaryGeneratedColumn()
  id_apoio: number;

  @ApiProperty({
    example: 'Amélia da Silva',
    description: 'Nome completo do apoio.',
    required: true,
  })
  @Column({ type: 'varchar', length: 100, nullable: false })
  nome_apoio: string;

  @ApiProperty({
    example: 'Mãe',
    description: 'Grau de parentesco. Ex: Mãe, Irmão, Primo, etc.',
    required: true,
  })
  @Column({ type: 'varchar', length: 50, nullable: false })
  parentesco: string;

  @ApiProperty({
    example: '11987654321',
    description:
      'Número de Whatsapp do apoio, sem espaços ou caracteres especiais.',
    required: true,
  })
  @Column({ type: 'char', length: 11, nullable: false })
  whatsapp: string;

  // Relação com tabela de pacientes
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'id_paciente' }) // Define que 'id_paciente' é a foreign key
  paciente: Patient;

  @ApiProperty({ example: 1, description: 'Identificador único do paciente' })
  @Column({ type: 'integer' })
  id_paciente: number;
}
