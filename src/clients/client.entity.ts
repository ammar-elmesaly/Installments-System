import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Person } from "../people/person.entity";
import { ClientStatus } from "./enums/clientStatus.enum";

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total_paid_cash: number;

  @Column({ type: 'enum', enum: ClientStatus, default: ClientStatus.Active })
  client_status: ClientStatus;

  @OneToOne(
    () => Person,
    person => person.client,
    { nullable: false, onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'person_id' })
  person: Person;
}