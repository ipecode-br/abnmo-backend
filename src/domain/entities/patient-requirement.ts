import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
  type PatientRequirementStatus,
  type PatientRequirementType,
} from '../enums/patient-requirements';
import type { PatientRequirementSchema } from '../schemas/patient-requirement';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('patient_requirements')
export class PatientRequirement
  extends BaseEntity
  implements PatientRequirementSchema
{
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: PATIENT_REQUIREMENT_TYPES })
  type: PatientRequirementType;

  @Column({
    type: 'enum',
    enum: PATIENT_REQUIREMENT_STATUSES,
    default: 'pending',
  })
  status: PatientRequirementStatus;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @Column('uuid')
  updatedBy: string;

  @Column('uuid')
  createdBy: string;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: User;
}
