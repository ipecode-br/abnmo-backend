import {
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

export abstract class BaseEntity {
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
