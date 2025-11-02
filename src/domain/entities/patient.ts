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
  PATIENT_STATUS,
  PatientSchema,
  PatientStatusType,
} from '../schemas/patient';
import { Appointment } from './appointment';
import { PatientRequirement } from './patient-requirement';
import { PatientSupport } from './patient-support';

@Entity('patients')
export class Patient implements PatientSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'enum', enum: GENDERS })
  gender: GenderType;

  @Column({ type: 'date' })
  date_of_birth: Date;

  @Column({ type: 'char', length: 11 })
  phone: string;

  @Column({ type: 'char', length: 11, unique: true })
  cpf: string;

  @Column({ type: 'enum', enum: BRAZILIAN_STATES })
  state: BrazilianStateType;

  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  has_disability: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  disability_desc: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  need_legal_assistance: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  take_medication: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  medication_desc: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  has_nmo_diagnosis: boolean;

  @Column({ type: 'enum', enum: PATIENT_STATUS, default: 'pending' })
  status: PatientStatusType;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PatientSupport, (support) => support.patient)
  supports: PatientSupport[];

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => PatientRequirement, (requirement) => requirement.patient)
  requirements: PatientRequirement[];
}
