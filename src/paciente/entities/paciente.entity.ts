import { ApiProperty } from '@nestjs/swagger';
import { Diagnostico } from 'src/diagnostico/entities/diagnostico.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('pacientes')
@Unique(['id_usuario'])
export class Paciente {
  @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
  @PrimaryGeneratedColumn({ type: 'integer' })
  id_usuario: number;

  @ApiProperty({
    example: 'https://example.com/uploads/profile.jpg',
    description:
      'URL da foto de perfil do usuário. Deve ser um link válido para uma imagem.',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  url_foto?: string;

  @ApiProperty({
    example: '1995-08-25T00:00:00.000Z',
    description:
      'Data de nascimento do usuário no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).',
    required: false,
  })
  @Column({ type: 'datetime', nullable: true })
  data_nascimento?: Date;

  @ApiProperty({
    example: '1234567890',
    description: 'CPF do usuário',
    required: false,
  })
  @Column({ type: 'char', length: 11, nullable: true })
  cpf?: string;

  @ApiProperty({
    example: 'Feminino',
    description:
      'Descrição do gênero do usuário. Pode ser Masculino, Feminino, Não-binário, etc.',
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  desc_genero?: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Nome da cidade onde o usuário reside.',
    required: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  cidade?: string;

  @ApiProperty({
    example: 'SP',
    description: 'Sigla do estado onde o usuário reside (ex: SP, RJ, RS).',
    required: false,
  })
  @Column({ type: 'char', length: 2, nullable: true })
  sigla_estado?: string;

  @ApiProperty({
    example: '11987654321',
    description:
      'Número de WhatsApp do usuário, sem espaços ou caracteres especiais.',
    required: false,
  })
  @Column({ type: 'char', length: 11, nullable: true })
  whatsapp?: string;

  @ApiProperty({
    example: 1,
    description:
      'Indica se o usuário possui alguma deficiência. 1 = Sim, 0 = Não.',
    required: true,
  })
  @Column({ type: 'tinyint', width: 1, default: 0 })
  possui_deficiencia: boolean;

  @ApiProperty({
    example: 'Deficiência visual e auditiva',
    description:
      'Descrição detalhada da(s) deficiência(s) do usuário, se houver.',
    required: false,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  desc_deficiencias?: string;

  @ApiProperty({
    example: 0,
    description:
      'Indica se o usuário precisa de assistência legal. 1 = Sim, 0 = Não.',
    required: true,
  })
  @Column({ type: 'tinyint', width: 1, default: 0 })
  precisa_assist_legal: boolean;

  @ApiProperty({
    example: 1,
    description:
      'Indica se o usuário faz uso contínuo de medicamentos. 1 = Sim, 0 = Não.',
    required: true,
  })
  @Column({ type: 'tinyint', width: 1, default: 0 })
  usa_medicamento: boolean;

  @ApiProperty({
    example: 'Medicamento para pressão alta, uso diário.',
    description:
      'Descrição dos medicamentos utilizados pelo usuário, se houver.',
    required: false,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  desc_medicamentos?: string;

  @ApiProperty({
    example: 'diagnostico_usuario.pdf',
    description: 'Nome do arquivo contendo o diagnóstico médico do usuário.',
    required: false,
  })
  @Column({ type: 'varchar', length: 200, nullable: true })
  filename_diagnostico?: string;

  @ApiProperty({
    example: 1,
    description: 'Identificador único do diagnóstico',
    required: false,
  })
  @Column({ type: 'integer' })
  id_diagnostico?: number;

  // Relação com outras tabelas
  @OneToOne(() => User)
  @JoinColumn({ name: 'id_usuario' }) // Define que 'id_usuario' é a foreign key
  userEntity: User;

  @ManyToOne(() => Diagnostico, (diagnostico) => diagnostico.pacientes, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_diagnostico' })
  diagnostico?: Diagnostico;
}
