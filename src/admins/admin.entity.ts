import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Person } from "../people/person.entity";
import { AdminLevel } from "./enums/adminLevel.enum";

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
  @JoinColumn({ name: 'person' })
  person: Person;
}