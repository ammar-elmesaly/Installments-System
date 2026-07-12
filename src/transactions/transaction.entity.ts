import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "../admins/admin.entity";
import { PaymentType } from "../installment_plans/enums/paymentType.enum";
import { InstallmentPlan } from "../installment_plans/installment_plan.entity";

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PaymentType })
  payment_type: PaymentType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(
    () => Admin,
    admin => admin.transactions,
    { nullable: false, onDelete: 'SET NULL' }
  )
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @ManyToOne(
    () => InstallmentPlan,
    installment_plan => installment_plan.transactions,
    { nullable: false, onDelete: 'NO ACTION' }
  )
  installment_plan: InstallmentPlan;
}