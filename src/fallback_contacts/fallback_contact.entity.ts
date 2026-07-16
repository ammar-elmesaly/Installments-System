import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Client } from "../clients/client.entity";

@Entity('fallback_contacts')
export class FallbackContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  relationship: string;

  @Column({ type: 'char', length: 11, unique: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes?: string;

  @ManyToMany(
    () => Client,
    client => client.fallback_contacts,
    { cascade: true }
  )
  clients: Client[];
}