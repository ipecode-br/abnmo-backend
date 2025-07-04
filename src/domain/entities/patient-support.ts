import {
  Column,
  CreateDateColumn,
  Entity,
<<<<<<< HEAD
  JoinColumn,
  ManyToOne,
=======
  //JoinColumn,
  //ManyToOne,
>>>>>>> 778c4ce (feat(patient-support): change entity to ZOD standard)
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

<<<<<<< HEAD
import { PatientSupportSchema } from '../schemas/patient-support';
import { Patient } from './patient';

@Entity('patient_support')
export class PatientSupport implements PatientSupportSchema {
=======
// import { Patient } from '@/domain/entities/patient';
import { PatientSuppoprtSchema } from '../schemas/patient-support';

@Entity('support')
export class PatientSupport implements PatientSuppoprtSchema {
>>>>>>> 778c4ce (feat(patient-support): change entity to ZOD standard)
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

<<<<<<< HEAD
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
=======
  /*
  @ManyToOne(() => Patient)
  @JoinColumn({ name: patient_id })
  patient: Patient;
  */
>>>>>>> 778c4ce (feat(patient-support): change entity to ZOD standard)
}
