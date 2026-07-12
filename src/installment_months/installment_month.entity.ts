import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { InstallmentPlan } from "../installment_plans/installment_plan.entity";
import dayjs from 'dayjs';
import { InstallmentMonthStatus } from "./enums/installmentMonthStatus.enum";

@Entity('installment_months')
export class InstallmentMonth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  expected_amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paid_amount: number;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at: Date;

  @Column({ type: 'enum', enum: InstallmentMonthStatus, default: InstallmentMonthStatus.Pending })
  status: InstallmentMonthStatus;

  @ManyToOne(
    () => InstallmentPlan,
    installment_plan => installment_plan.installment_months,
    { nullable: false, onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'installment_plan_id' })
  installment_plan: InstallmentPlan;

  @BeforeInsert()
  setDueDate() {
    if (!this.due_date) {
      this.due_date = dayjs().add(1, 'month').toDate();
    }
  }
}