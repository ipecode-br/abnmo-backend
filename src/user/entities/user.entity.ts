import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity()
export class User {
  @ApiProperty({ example: 1, description: "Identificador único do usuário" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "João Silva", description: "Nome do usuário" })
  @Column({ length: 50 }) // Define um limite de caracteres
  name: string;

  @ApiProperty({ example: "email@example.com", description: "E-mail único do usuário" })
  @Column({ unique: true, length: 100 }) // Define um tamanho máximo adequado
  email: string;
}
