import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentPlansController } from './installment_plans.controller';

describe('InstallmentPlansController', () => {
  let controller: InstallmentPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstallmentPlansController],
    }).compile();

    controller = module.get<InstallmentPlansController>(InstallmentPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
