import { Test, TestingModule } from '@nestjs/testing';
import { FallbackContactsService } from './fallback_contacts.service';

describe('FallbackContactsService', () => {
  let service: FallbackContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FallbackContactsService],
    }).compile();

    service = module.get<FallbackContactsService>(FallbackContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
