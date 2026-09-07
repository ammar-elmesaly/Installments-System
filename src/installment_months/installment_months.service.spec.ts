import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentMonthsService } from './installment_months.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstallmentMonth } from './installment_month.entity';
import { DataSource } from 'typeorm';
import { InstallmentMonthStatus } from './enums/installmentMonthStatus.enum';

describe('InstallmentMonthsService', () => {
  let service: InstallmentMonthsService;
  let repository: { manager: any };
  let dataSource: { createQueryRunner: jest.Mock };

  beforeEach(async () => {
    repository = {
      manager: {},
    };
    dataSource = { createQueryRunner: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentMonthsService,
        { provide: getRepositoryToken(InstallmentMonth), useValue: repository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<InstallmentMonthsService>(InstallmentMonthsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an installment month in a local transaction', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      installment_plan_id: 'plan-id',
      due_date: new Date('2026-10-15'),
      expected_amount: 500,
    };
    const month = { id: 'month-id', ...dto } as any;
    queryRunner.isTransactionActive = false;
    queryRunner.manager.create.mockReturnValue(month);
    queryRunner.manager.save.mockResolvedValue(month);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(dto)).resolves.toBe(month);
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('creates an installment month within an active transaction', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      installment_plan_id: 'plan-id',
      due_date: new Date('2026-10-15'),
      expected_amount: 500,
    };
    const month = { id: 'month-id', ...dto } as any;
    queryRunner.isTransactionActive = true;
    queryRunner.manager.create.mockReturnValue(month);
    queryRunner.manager.save.mockResolvedValue(month);

    await expect(service.create(dto, queryRunner)).resolves.toBe(month);
    expect(queryRunner.connect).not.toHaveBeenCalled();
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).not.toHaveBeenCalled();
  });

  it('rolls back and releases on creation error with local transaction', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      installment_plan_id: 'plan-id',
      due_date: new Date('2026-10-15'),
      expected_amount: 500,
    };
    queryRunner.isTransactionActive = false;
    queryRunner.manager.create.mockReturnValue({} as any);
    queryRunner.manager.save.mockRejectedValue(new Error('Save failed'));
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(dto)).rejects.toThrow('Save failed');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('preserves expected amount and due date in the created month', async () => {
    const queryRunner = createQueryRunner();
    const dueDate = new Date('2026-11-20');
    const expectedAmount = 1250.75;
    const dto = {
      installment_plan_id: 'plan-id',
      due_date: dueDate,
      expected_amount: expectedAmount,
    };
    const month = { id: 'month-id', due_date: dueDate, expected_amount: expectedAmount } as any;
    queryRunner.isTransactionActive = false;
    queryRunner.manager.create.mockReturnValue(month);
    queryRunner.manager.save.mockResolvedValue(month);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await service.create(dto);

    expect(queryRunner.manager.create).toHaveBeenCalledWith(InstallmentMonth, expect.objectContaining({
      due_date: dueDate,
      expected_amount: expectedAmount,
      installment_plan: { id: 'plan-id' },
    }));
  });
});

function createQueryRunner() {
  return {
    isTransactionActive: false,
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
  } as any;
}
