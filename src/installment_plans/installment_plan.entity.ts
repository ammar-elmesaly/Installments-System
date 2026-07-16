import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Client } from "../clients/client.entity";
import { InstallmentPlanStatus } from "./enums/installmentPlanStatus.enum";
import { InstallmentMonth } from "../installment_months/installment_month.entity";
import { Transaction } from "../transactions/transaction.entity";

@Entity('installment_plans')
export class InstallmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: InstallmentPlanStatus, default: InstallmentPlanStatus.Active })
  status: InstallmentPlanStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_amount: number;  // total without the down payment (meaning to pay)

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  down_payment: number;  // مقدم

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  monthly_amount: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes?: string;
  
  @ManyToOne(
    () => Client,
    client => client.installment_plans,
    { nullable: false, onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(
    () => InstallmentMonth,
    installment_month => installment_month.installment_plan
  )
  installment_months: InstallmentMonth[];

  @OneToMany(
    () => Transaction,
    transaction => transaction.installment_plan
  )
  transactions: Transaction[];
}