import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: { find: jest.Mock };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: repository },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds the latest transactions for a plan with the default limit', async () => {
    const transactions = [{ id: 'transaction-id' } as Transaction];
    repository.find.mockResolvedValue(transactions);

    await expect(service.findByPlan('plan-id')).resolves.toBe(transactions);
    expect(repository.find).toHaveBeenCalledWith({
      where: { installment_plan: { id: 'plan-id' } },
      relations: {
        admin: { person: true },
        installment_month: true,
      },
      order: { created_at: 'DESC' },
      take: 10,
    });
  });

  it('uses a caller-provided transaction limit', async () => {
    repository.find.mockResolvedValue([]);

    await expect(service.findByPlan('plan-id', 25)).resolves.toEqual([]);

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { installment_plan: { id: 'plan-id' } },
        take: 25,
      }),
    );
  });

  it('propagates repository errors', async () => {
    const error = new Error('database unavailable');
    repository.find.mockRejectedValue(error);

    await expect(service.findByPlan('plan-id')).rejects.toBe(error);
  });
});
