// import { ApiProperty } from '@nestjs/swagger';
// import {
//   Column,
//   CreateDateColumn,
//   Entity,
//   PrimaryGeneratedColumn,
// } from 'typeorm';

// @Entity('usuarios')
// export class User {
//   @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
//   @PrimaryGeneratedColumn({ type: 'integer' })
//   id: number;

//   @ApiProperty({
//     example: 'user@example.com',
//     description: 'Endereço de e-mail único do usuário.',
//   })
//   @Column({ type: 'varchar', length: 320, unique: true })
//   email: string;

//   @ApiProperty({
//     example: 'senha123',
//     description: 'Senha do usuário armazenada de forma segura (hash).',
//   })
//   @Column({ type: 'varchar', length: 255, nullable: true })
//   password?: string;

//   @ApiProperty({
//     example: 0,
//     description: 'Indica se o login foi feito pelo Facebook. 1 = Sim, 0 = Não.',
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0 })
//   flag_login_facebook: boolean;

//   @ApiProperty({
//     example: 0,
//     description: 'Indica se o login foi feito pelo Gmail. 1 = Sim, 0 = Não.',
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0 })
//   flag_login_gmail: boolean;

//   @ApiProperty({
//     example: 'abc123xyz',
//     description: 'Identificador OAuth do usuário (se aplicável).',
//     required: false,
//   })
//   @Column({ type: 'varchar', length: 255, nullable: true })
//   id_oauth?: string;

//   @ApiProperty({
//     example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
//     description: 'Token de autenticação OAuth do usuário (se aplicável).',
//     required: false,
//   })
//   @Column({ type: 'text', nullable: true })
//   token_oauth?: string;

//   @ApiProperty({
//     example: 'João da Silva',
//     description: 'Nome completo do usuário.',
//   })
//   @Column({ type: 'varchar', length: 100, nullable: false })
//   fullname: string;

//   @ApiProperty({
//     example: '2024-02-27T12:30:00.000Z',
//     description: 'Data e hora de cadastro do usuário.',
//   })
//   @ApiProperty({
//     example: 0,
//     description:
//       'Indica se o usuário foi deletado logicamente. 1 = Sim, 0 = Não.',
//   })
//   @Column({ type: 'tinyint', width: 1, default: 0 })
//   flag_is_removed: boolean;

//   @CreateDateColumn({ type: 'timestamp' })
//   createdAt?: Date;
// }
