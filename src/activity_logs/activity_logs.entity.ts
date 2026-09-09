import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "../admins/admin.entity";
import { ActivityAction } from "./enums/activityAction.enum";

@Entity('activity_logs')
@Index(['admin', 'created_at'])
@Index(['target_id', 'created_at'])
@Index(['action', 'created_at'])
@Index(['created_at'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Admin,
    { nullable: true, onDelete: 'SET NULL' }
  )
  @JoinColumn({ name: 'admin_id' })
  admin?: Admin;

  @Column({ type: 'enum', enum: ActivityAction })
  action: ActivityAction;

  @Column({ type: 'uuid', nullable: true })
  target_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  target_label: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;
}