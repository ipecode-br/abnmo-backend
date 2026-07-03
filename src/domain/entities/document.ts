import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentCategory,
  type DocumentMimeType,
  type DocumentStatus,
} from '../enums/documents';
import type { DocumentSchema } from '../schemas/documents';
import { BaseEntity } from './base';
import { SurveySubmission } from './survey-submission';
import { User } from './user';

@Entity('documents')
export class Document extends BaseEntity implements DocumentSchema {
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 256 })
  filename: string;

  @Column({ type: 'varchar', length: 512 })
  key: string;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar', length: 64 })
  mimeType: DocumentMimeType;

  @Column({ type: 'enum', enum: DOCUMENT_CATEGORIES })
  category: DocumentCategory;

  @Column({
    type: 'enum',
    enum: DOCUMENT_STATUSES,
    default: 'pending',
  })
  status: DocumentStatus;

  @ManyToOne(() => User, (user) => user.documents)
  user: User;

  @OneToOne(() => SurveySubmission, (submission) => submission.document, {
    nullable: true,
  })
  @JoinColumn({ name: 'submission_id' })
  submission: SurveySubmission | null;
}
