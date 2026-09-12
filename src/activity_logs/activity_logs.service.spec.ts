import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsService } from './activity_logs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLog } from './activity_logs.entity';
import { ActivityAction } from './enums/activityAction.enum';

jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;
  let repository: { create: jest.Mock; save: jest.Mock };
  let paginateMock: jest.Mock;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogsService,
        { provide: getRepositoryToken(ActivityLog), useValue: repository },
      ],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
    paginateMock = require('nestjs-typeorm-paginate').paginate;
    paginateMock.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and saves an activity log with nullable optional fields', async () => {
    const entry = { id: 'log-id' } as ActivityLog;
    repository.create.mockReturnValue(entry);
    repository.save.mockResolvedValue(entry);

    await expect(
      service.log({
        action: ActivityAction.Create,
      }),
    ).resolves.toBeUndefined();

    expect(repository.create).toHaveBeenCalledWith({
      admin: undefined,
      action: ActivityAction.Create,
      target_id: null,
      target_label: null,
      metadata: null,
    });
    expect(repository.save).toHaveBeenCalledWith(entry);
  });

  it('uses an external manager repository when provided', async () => {
    const managerRepository = {
      create: jest.fn().mockReturnValue({ id: 'log-id' }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(managerRepository),
    };
    const admin = { id: 'admin-id' } as any;
    const metadata = { amount: 100 };

    await service.log(
      {
        admin,
        action: ActivityAction.Update,
        target_id: 'target-id',
        target_label: 'Target',
        metadata,
      },
      manager as any,
    );

    expect(manager.getRepository).toHaveBeenCalledWith(ActivityLog);
    expect(managerRepository.create).toHaveBeenCalledWith({
      admin,
      action: ActivityAction.Update,
      target_id: 'target-id',
      target_label: 'Target',
      metadata,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('propagates errors when saving an activity log fails', async () => {
    const error = new Error('database unavailable');
    repository.create.mockReturnValue({ id: 'log-id' });
    repository.save.mockRejectedValue(error);

    await expect(service.log({ action: ActivityAction.Delete })).rejects.toBe(
      error,
    );
  });

  it('paginates logs with admin relations and newest-first ordering', async () => {
    const options = { page: 2, limit: 15 };
    const pagination = { items: [], meta: {} };
    paginateMock.mockResolvedValue(pagination);

    await expect(service.paginate(options)).resolves.toBe(pagination);

    expect(paginateMock).toHaveBeenCalledWith(repository, options, {
      relations: { admin: { person: true } },
      order: { created_at: 'DESC' },
    });
  });
});
