import { ApiProperty } from '@nestjs/swagger';
import { Paciente } from 'src/paciente/entities/paciente.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('diagnosticos')
export class Diagnostico {
  @ApiProperty({
    example: 1,
    description: 'Identificador único do diagnóstico',
  })
  @PrimaryColumn()
  id_diagnostico: number;

  @ApiProperty({
    example: 'Diagnóstico de hipertensão arterial',
    description: 'Descrição do diagnóstico do paciente',
    required: true,
  })
  @Column({ type: 'varchar', length: 40 })
  desc_diagnostico: string;

  @OneToMany(() => Paciente, (paciente) => paciente.diagnostico)
  pacientes: Paciente[];
}
