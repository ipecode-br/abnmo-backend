import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  // ManyToOne,
  // OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// import { Diagnostic } from '@/domain/entities/diagnostic';
// import { PatientSupport } from '@/domain/entities/patient-support';
import { User } from '@/domain/entities/user';

import { GENDERS, GenderType, PatientSchema } from '../schemas/patient';

@Entity('pacientes')
export class Patient implements PatientSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'enum', enum: GENDERS, nullable: false })
  gender: GenderType;

  @Column({ type: 'date', nullable: false })
  date_of_birth: Date;

  @Column({ type: 'char', length: 11, nullable: false })
  phone: string;

  @Column({ type: 'char', length: 11, nullable: false })
  cpf: string;

  @Column({ type: 'char', length: 2, nullable: false })
  state: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_photo: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
  has_disability: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  disability_desc: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
  need_legal_assistance: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0, nullable: false })
  take_medication: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  medication_desc: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  filename_diagnostic: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  has_nmo_diagnosis: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  flag_active: boolean;

  @OneToOne(() => User)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  // @Column({ name: 'id_diagnostic', type: 'int', nullable: false })
  // id_diagnostic: number;

  // @ManyToOne(() => Diagnostic, { nullable: false })
  // @JoinColumn({ name: 'id_diagnostic' })
  // diagnostic: Diagnostic;

  // @OneToMany(() => PatientSupport, (support) => support.patient)
  // support: PatientSupport[];
}
