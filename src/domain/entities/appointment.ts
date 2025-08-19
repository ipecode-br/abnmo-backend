import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  APPOINTMENT_CONDITION,
  APPOINTMENT_STATUS,
  AppointmentConditionType,
  AppointmentSchema,
  AppointmentStatusType,
} from '../schemas/appointments';

@Entity('appointments')
export class Appointment implements AppointmentSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patient_id: string;

  @Column('uuid')
  specialist_id: string;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ type: 'enum', enum: APPOINTMENT_STATUS, nullable: false })
  status: AppointmentStatusType;

  @Column({ type: 'enum', enum: APPOINTMENT_CONDITION, nullable: true })
  condition: AppointmentConditionType | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  annotation: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
