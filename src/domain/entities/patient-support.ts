import {
  Column,
  CreateDateColumn,
  Entity,
  //JoinColumn,
  //ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

//import { Patient } from '@/domain/entities/patient';
import { PatientSupportSchema } from '../schemas/patient-support';

@Entity('patient_support')
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
  /*
  @ManyToOne(() => Patient)
  @JoinColumn({ name: patient_id })
  patient: Patient;
*/
}
