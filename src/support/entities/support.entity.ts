import { ApiProperty } from '@nestjs/swagger';
import { Patient } from 'src/patient/entities/patient.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('apoios')
export class Support {
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
  @ManyToMany(() => Patient, (patient) => patient.apoios)
  pacientes: Patient[];
}
