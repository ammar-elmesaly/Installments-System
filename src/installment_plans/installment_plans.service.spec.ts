import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentPlansService } from './installment_plans.service';

describe('InstallmentPlansService', () => {
  let service: InstallmentPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstallmentPlansService],
    }).compile();

    service = module.get<InstallmentPlansService>(InstallmentPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
