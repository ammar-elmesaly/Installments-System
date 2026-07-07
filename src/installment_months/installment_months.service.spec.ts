import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentMonthsService } from './installment_months.service';

describe('InstallmentMonthsService', () => {
  let service: InstallmentMonthsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstallmentMonthsService],
    }).compile();

    service = module.get<InstallmentMonthsService>(InstallmentMonthsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
