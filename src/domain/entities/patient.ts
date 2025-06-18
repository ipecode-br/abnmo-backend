// import { ApiProperty } from '@nestjs/swagger';
// import {
//   Column,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   OneToMany,
//   OneToOne,
//   PrimaryGeneratedColumn,
// } from 'typeorm';

// import { Diagnostic } from '@/domain/entities/diagnostic';
// import { PatientSupport } from '@/domain/entities/patient-support';
// import { User } from '@/domain/entities/user';

// @Entity('pacientes')
// export class Patient {
//   @ApiProperty({ example: 1, description: 'Identificador único do paciente' })
//   @PrimaryGeneratedColumn({ type: 'integer' })
//   id_gender: number;

//   @ApiProperty({
//     example: 'Feminino',
//     description:
//       'Descrição do gênero do usuário. Pode ser Masculino, Feminino, Não-binário, etc.',
//     required: true,
//   })
//   @Column({ type: 'varchar', length: 100, nullable: false })
//   desc_gender: string;

//   @ApiProperty({
//     example: '1995-08-25',
//     description: 'Data de nascimento do paciente (YYYY-MM-DD).',
//     required: true,
//   })
//   @Column({ type: 'date', nullable: false })
//   birth_of_date: Date;

//   @ApiProperty({
//     example: 'São Paulo',
//     description: 'Nome da cidade onde o usuário reside.',
//     required: true,
//   })
//   @Column({ type: 'varchar', length: 50, nullable: false })
//   city: string;

//   @ApiProperty({
//     example: 'SP',
//     description: 'Sigla do estado onde o usuário reside (ex: SP, RJ, RS).',
//     required: true,
//   })
//   @Column({ type: 'char', length: 2, nullable: false })
//   state: string;

//   @ApiProperty({
//     example: '11987654321',
//     description:
//       'Número de WhatsApp do usuário, sem espaços ou caracteres especiais.',
//     required: true,
//   })
//   @Column({ type: 'char', length: 11, nullable: false })
//   whatsapp: string;

//   @ApiProperty({
//     example: '1234567890',
//     description: 'CPF do usuário, sem espaços ou caracteres especiais.',
//     required: true,
//   })
//   @Column({ type: 'char', length: 11, nullable: false })
//   cpf: string;

//   @ApiProperty({
//     example: 'https://example.com/uploads/profile.jpg',
//     description:
//       'URL da foto de perfil do usuário. Deve ser um link válido para uma imagem.',
//     required: true,
//   })
//   @Column({ type: 'varchar', length: 255, nullable: false })
//   url_photo: string;

//   @ApiProperty({
//     example: 1,
//     description:
//       'Indica se o usuário possui alguma deficiência. 1 = Sim, 0 = Não.',
//     required: true,
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
//   have_disability: boolean;

//   @ApiProperty({
//     example: 'Deficiência visual e auditiva',
//     description:
//       'Descrição detalhada da(s) deficiência(s) do usuário, se houver.',
//     required: false,
//   })
//   @Column({ type: 'varchar', length: 500, nullable: true })
//   desc_disability: string | null;

//   @ApiProperty({
//     example: 0,
//     description:
//       'Indica se o usuário precisa de assistência legal. 1 = Sim, 0 = Não.',
//     required: true,
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
//   need_legal_help: boolean;

//   @ApiProperty({
//     example: 1,
//     description:
//       'Indica se o usuário faz uso contínuo de medicamentos. 1 = Sim, 0 = Não.',
//     required: true,
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
//   use_medicine: boolean;

//   @ApiProperty({
//     example: 'Medicamento para pressão alta, uso diário.',
//     description:
//       'Descrição detalhada do(s) medicamento(s) utilizado(s) pelo usuário, se houver.',
//     required: false,
//   })
//   @Column({ type: 'varchar', length: 500, nullable: true })
//   desc_medicine: string | null;

//   @ApiProperty({
//     example: 'diagnostico_usuario.pdf',
//     description: 'Nome do arquivo contendo o diagnóstico médico do usuário.',
//     required: false,
//   })
//   @Column({ type: 'varchar', length: 200, nullable: true })
//   filename_diagnostic: string | null;

//   @ApiProperty({
//     example: 1,
//     description: 'Indica se o paciente está ativo. 1 = Sim, 0 = Não.',
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0 })
//   flag_active: boolean;

//   @ManyToOne(() => Diagnostic)
//   @JoinColumn({ name: 'id_diagnostico' })
//   diagnostic: Diagnostic;

//   @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
//   @Column({ type: 'integer' })
//   id_diagnostic: number;

//   @OneToOne(() => User)
//   @JoinColumn({ name: 'id_usuario' })
//   user: User;

//   @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
//   @Column({ type: 'integer' })
//   id_user: number;

//   @OneToMany(() => PatientSupport, (support) => support.patient)
//   support: PatientSupport[];
// }
