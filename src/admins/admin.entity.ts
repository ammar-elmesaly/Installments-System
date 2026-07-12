import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Person } from "../people/person.entity";
import { AdminLevel } from "./enums/adminLevel.enum";
import { Transaction } from "../transactions/transaction.entity";

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AdminLevel, default: AdminLevel.Auditor })
  admin_level: AdminLevel;

  @OneToOne(
    () => Person,
    person => person.admin,
    { nullable: false, onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @OneToMany(
    () => Transaction,
    transaction => transaction.admin
  )
  transactions: Transaction[];
}