import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Client } from "../clients/client.entity";
import { InstallmentPlanStatus } from "./enums/installmentPlanStatus.enum";
import { InstallmentMonth } from "../installment_months/installment_month.entity";

@Entity('installment_plans')
export class InstallmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: InstallmentPlanStatus, default: InstallmentPlanStatus.Active })
  status: InstallmentPlanStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_amount: number;
  
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
}