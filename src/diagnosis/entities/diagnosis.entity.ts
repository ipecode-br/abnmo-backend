import { ApiProperty } from '@nestjs/swagger';
import { Patient } from 'src/patient/entities/patient.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('diagnosticos')
export class Diagnosis {
  @ApiProperty({
    example: 1,
    description: 'Identificador único do diagnóstico',
  })
  @PrimaryGeneratedColumn({ type: 'integer' })
  id_diagnostico: number;

  @ApiProperty({
    example: 'Diagnóstico de hipertensão arterial',
    description: 'Descrição do diagnóstico do paciente',
    required: true,
  })
  @Column({ type: 'varchar', length: 40 })
  desc_diagnostico: string;

  @OneToMany(() => Patient, (patient) => patient.diagnostico)
  pacientes: Patient[];
}
