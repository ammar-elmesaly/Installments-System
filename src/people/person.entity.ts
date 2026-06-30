import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Client } from "../clients/client.entity";

@Unique('UQ_full_name', ['first_name', 'second_name', 'third_name', 'last_name'])
@Entity('people')
export abstract class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  second_name: string;

  @Column({ type: 'varchar', length: 100 })
  third_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'char', length: 11, unique: true })
  phone_number: string;

  @Column({ type: 'varchar', length: '150', nullable: true })
  profession?: string;

  @Column({ type: 'varchar', length: '200', nullable: true })
  address?: string;

  @Column({ nullable: true })
  image_path?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;

  @OneToOne(
    () => Client,
    client => client.person
  )
  client: Client;
}