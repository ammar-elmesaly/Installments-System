import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentPlansService } from './installment_plans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { DataSource } from 'typeorm';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';
import { InstallmentPlanStatus } from './enums/installmentPlanStatus.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentType } from './enums/paymentType.enum';

describe('InstallmentPlansService', () => {
  let service: InstallmentPlansService;
  let repository: { findOne: jest.Mock; find: jest.Mock; createQueryBuilder: jest.Mock; manager: any; save: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let activityLogsService: jest.Mocked<ActivityLogsService>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { findOne: jest.fn() },
      save: jest.fn(),
    };
    dataSource = { createQueryRunner: jest.fn() };
    activityLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ActivityLogsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentPlansService,
        { provide: getRepositoryToken(InstallmentPlan), useValue: repository },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<InstallmentPlansService>(InstallmentPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('paginates installment plans with status and search filters', async () => {
    const mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('SELECT ...'),
      getParameters: jest.fn().mockReturnValue({}),
      getCount: jest.fn().mockResolvedValue(5),
      getMany: jest.fn().mockResolvedValue([]),
      setParameters: jest.fn().mockReturnThis(),
    };
    repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await service.paginate({ page: 1, limit: 10 }, InstallmentPlanStatus.Active, 'search');

    expect(repository.createQueryBuilder).toHaveBeenCalled();
    expect(mockQueryBuilder.getCount).toHaveBeenCalled();
    expect(mockQueryBuilder.getMany).toHaveBeenCalled();
  });

  it('throws when freezing a paid or already frozen plan', async () => {
    repository.findOne.mockResolvedValueOnce({
      id: 'plan-id',
      status: InstallmentPlanStatus.Paid,
    } as any);
    repository.manager.findOne.mockResolvedValue({ person: { admin: {} } } as any);

    await expect(service.freeze('plan-id', 'account-id')).rejects.toBeInstanceOf(BadRequestException);

    repository.findOne.mockResolvedValueOnce({
      id: 'plan-id',
      status: InstallmentPlanStatus.Frozen,
    } as any);

    await expect(service.freeze('plan-id', 'account-id')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('freezes an active plan and logs the action', async () => {
    const plan = {
      id: 'plan-id',
      status: InstallmentPlanStatus.Active,
      client: { person: { first_name: 'John', last_name: 'Doe' } },
    } as any;
    repository.manager.findOne.mockResolvedValue({ person: { admin: {} } } as any);
    repository.findOne.mockResolvedValueOnce(plan);
    repository.save.mockResolvedValue({ ...plan, status: InstallmentPlanStatus.Frozen });

    const result = await service.freeze('plan-id', 'account-id');

    expect(result.status).toBe(InstallmentPlanStatus.Frozen);
    expect(repository.save).toHaveBeenCalled();
    expect(activityLogsService.log).toHaveBeenCalled();
  });

  it('unfreezes a frozen plan and logs the action', async () => {
    const plan = {
      id: 'plan-id',
      status: InstallmentPlanStatus.Frozen,
      client: { person: { first_name: 'Jane', last_name: 'Smith' } },
    } as any;
    repository.manager.findOne.mockResolvedValue({ person: { admin: {} } } as any);
    repository.findOne.mockResolvedValueOnce(plan);
    repository.save.mockResolvedValue({ ...plan, status: InstallmentPlanStatus.Active });

    const result = await service.unfreeze('plan-id', 'account-id');

    expect(result.status).toBe(InstallmentPlanStatus.Active);
    expect(repository.save).toHaveBeenCalled();
    expect(activityLogsService.log).toHaveBeenCalled();
  });

  it('throws when admin is not found during freeze', async () => {
    repository.manager.findOne.mockResolvedValue(null);

    await expect(service.freeze('plan-id', 'account-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when plan is not found during freeze', async () => {
    repository.manager.findOne.mockResolvedValue({ person: { admin: {} } } as any);
    repository.findOne.mockResolvedValue(null);

    await expect(service.freeze('plan-id', 'account-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates plan notes and logs the action', async () => {
    const plan = {
      id: 'plan-id',
      notes: 'old notes',
      client: { person: { first_name: 'Alice', last_name: 'Brown' } },
    } as any;
    repository.manager.findOne.mockResolvedValue({ person: { admin: {} } } as any);
    repository.findOne.mockResolvedValue(plan);
    repository.save.mockResolvedValue({ ...plan, notes: 'new notes' });

    const result = await service.updateNotes('plan-id', 'new notes', 'account-id');

    expect(result.notes).toBe('new notes');
    expect(repository.save).toHaveBeenCalled();
    expect(activityLogsService.log).toHaveBeenCalled();
  });
});
