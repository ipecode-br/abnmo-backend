// import { ApiProperty } from '@nestjs/swagger';
// import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// import { Patient } from '@/domain/entities/patient';

// @Entity('diagnostics')
// export class Diagnostic {
//   @ApiProperty({
//     example: 1,
//     description: 'Identificador único do diagnóstico',
//   })
//   @PrimaryGeneratedColumn({ type: 'integer' })
//   id: number;

//   @ApiProperty({
//     example: 'Diagnóstico de hipertensão arterial',
//     description: 'Descrição do diagnóstico do paciente',
//     required: true,
//   })
//   @Column({ type: 'varchar', length: 40 })
//   desc_diagnostic: string;

//   @OneToMany(() => Patient, (patient) => patient.diagnostic)
//   patients: Patient[];
// }
