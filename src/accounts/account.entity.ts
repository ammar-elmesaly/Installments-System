import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Person } from "../people/person.entity";
import { Role } from "./enums/role";
import { Exclude } from "class-transformer";

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 1 })
  token_version: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  @Exclude()
  password_hash: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @OneToOne(
    () => Person,
    person => person.account,
    { nullable: false, onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'person_id' })
  person: Person;
}