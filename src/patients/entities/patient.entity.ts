import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Diagnostic } from '@/diagnostics/entities/diagnostic.entity';
import { PatientSupport } from '@/patient-supports/entities/patient-support.entity';
import { User } from '@/users/entities/user.entity';

@Entity('pacientes')
export class Patient {
  @ApiProperty({ example: 1, description: 'Identificador único do paciente' })
  @PrimaryGeneratedColumn({ type: 'integer' })
  id_paciente: number;

  @ApiProperty({
    example: 'Feminino',
    description:
      'Descrição do gênero do usuário. Pode ser Masculino, Feminino, Não-binário, etc.',
    required: true,
  })
  @Column({ type: 'varchar', length: 100, nullable: false })
  desc_genero: string;

  @ApiProperty({
    example: '1995-08-25',
    description: 'Data de nascimento do paciente (YYYY-MM-DD).',
    required: true,
  })
  @Column({ type: 'date', nullable: false })
  data_nascimento: Date;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Nome da cidade onde o usuário reside.',
    required: true,
  })
  @Column({ type: 'varchar', length: 50, nullable: false })
  cidade: string;

  @ApiProperty({
    example: 'SP',
    description: 'Sigla do estado onde o usuário reside (ex: SP, RJ, RS).',
    required: true,
  })
  @Column({ type: 'char', length: 2, nullable: false })
  sigla_estado: string;

  @ApiProperty({
    example: '11987654321',
    description:
      'Número de WhatsApp do usuário, sem espaços ou caracteres especiais.',
    required: true,
  })
  @Column({ type: 'char', length: 11, nullable: false })
  whatsapp: string;

  @ApiProperty({
    example: '1234567890',
    description: 'CPF do usuário, sem espaços ou caracteres especiais.',
    required: true,
  })
  @Column({ type: 'char', length: 11, nullable: false })
  cpf: string;

  @ApiProperty({
    example: 'https://example.com/uploads/profile.jpg',
    description:
      'URL da foto de perfil do usuário. Deve ser um link válido para uma imagem.',
    required: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: false })
  url_foto: string;

  @ApiProperty({
    example: 1,
    description:
      'Indica se o usuário possui alguma deficiência. 1 = Sim, 0 = Não.',
    required: true,
  })
  @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
  possui_deficiencia: boolean;

  @ApiProperty({
    example: 'Deficiência visual e auditiva',
    description:
      'Descrição detalhada da(s) deficiência(s) do usuário, se houver.',
    required: false,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  desc_deficiencias: string | null;

  @ApiProperty({
    example: 0,
    description:
      'Indica se o usuário precisa de assistência legal. 1 = Sim, 0 = Não.',
    required: true,
  })
  @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
  precisa_assist_legal: boolean;

  @ApiProperty({
    example: 1,
    description:
      'Indica se o usuário faz uso contínuo de medicamentos. 1 = Sim, 0 = Não.',
    required: true,
  })
  @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
  usa_medicamento: boolean;

  @ApiProperty({
    example: 'Medicamento para pressão alta, uso diário.',
    description:
      'Descrição detalhada do(s) medicamento(s) utilizado(s) pelo usuário, se houver.',
    required: false,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  desc_medicamentos: string | null;

  @ApiProperty({
    example: 'diagnostico_usuario.pdf',
    description: 'Nome do arquivo contendo o diagnóstico médico do usuário.',
    required: false,
  })
  @Column({ type: 'varchar', length: 200, nullable: true })
  filename_diagnostico: string | null;

  @ApiProperty({
    example: 1,
    description: 'Indica se o paciente está ativo. 1 = Sim, 0 = Não.',
  })
  @Column({ type: 'tinyint', width: 1, default: 0 })
  flag_ativo: boolean;

  @ManyToOne(() => Diagnostic)
  @JoinColumn({ name: 'id_diagnostico' })
  diagnostico: Diagnostic;

  @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
  @Column({ type: 'integer' })
  id_diagnostico: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;

  @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
  @Column({ type: 'integer' })
  id_usuario: number;

  @OneToMany(() => PatientSupport, (support) => support.paciente)
  apoios: PatientSupport[];
}
