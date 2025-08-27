import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PatientSupportSchema } from '../schemas/patient-support';
import { Patient } from './patient';

@Entity('patient_supports')
export class PatientSupport implements PatientSupportSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  patient_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'char', length: 11 })
  phone: string;

  @Column({ type: 'varchar', length: 50 })
  kinship: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.supports)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
