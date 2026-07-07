import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentMonthsController } from './installment_months.controller';

describe('InstallmentMonthsController', () => {
  let controller: InstallmentMonthsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstallmentMonthsController],
    }).compile();

    controller = module.get<InstallmentMonthsController>(InstallmentMonthsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
