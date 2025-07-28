import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  BRAZILIAN_STATES,
  type BrazilianStateType,
} from '@/constants/brazilian-states';
import { User } from '@/domain/entities/user';

import {
  GENDERS,
  GenderType,
  PatientSchema,
  STATUS,
  StatusType,
} from '../schemas/patient';
import { PatientSupport } from './patient-support';

@Entity('patients')
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

  @Column({ type: 'enum', enum: BRAZILIAN_STATES, nullable: false })
  state: BrazilianStateType;

  @Column({ type: 'varchar', length: 50, nullable: false })
  city: string;

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

  @Column({ type: 'tinyint', width: 1, default: 0 })
  has_nmo_diagnosis: boolean;

  @Column({ type: 'enum', enum: STATUS })
  status: StatusType;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PatientSupport, (support) => support.patient)
  supports: PatientSupport[];
}
