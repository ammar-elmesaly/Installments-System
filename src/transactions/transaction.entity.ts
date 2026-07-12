import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;
}