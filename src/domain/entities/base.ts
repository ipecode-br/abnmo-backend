import {
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

import { BaseEntitySchema } from '../schemas/base';

export abstract class BaseEntity implements BaseEntitySchema {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
