import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: { findByPlan: jest.Mock };

  beforeEach(async () => {
    service = {
      findByPlan: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: service }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates plan transaction lookup to the service', async () => {
    const transactions = [{ id: 'transaction-id' }];
    service.findByPlan.mockResolvedValue(transactions);

    await expect(controller.findByPlan('plan-id')).resolves.toBe(transactions);
    expect(service.findByPlan).toHaveBeenCalledWith('plan-id');
  });
});
