import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ActivityLog } from './activity_logs.entity';
import { ActivityAction } from './enums/activityAction.enum';
import { Admin } from '../admins/admin.entity';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

interface LogParams {
  admin?: Admin;
  action: ActivityAction;
  target_id?: string;
  target_label?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  // Accepts an optional EntityManager so calls can participate in an
  // existing queryRunner transaction (e.g. inside pay()/create() which
  // already use their own transaction) instead of opening a second one.
  async log(params: LogParams, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(ActivityLog) : this.activityLogRepository;
    const entry = repo.create({
      admin: params.admin,
      action: params.action,
      target_id: params.target_id ?? null,
      target_label: params.target_label ?? null,
      metadata: params.metadata ?? null,
    });
    await repo.save(entry);
  }

  paginate(options: IPaginationOptions): Promise<Pagination<ActivityLog>> {
    return paginate<ActivityLog>(this.activityLogRepository, options, {
      relations: { admin: { person: true } },
      order: { created_at: 'DESC' },
    });
  }
}