import { Test, TestingModule } from '@nestjs/testing';
import { FallbackContactsController } from './fallback_contacts.controller';

describe('FallbackContactsController', () => {
  let controller: FallbackContactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FallbackContactsController],
    }).compile();

    controller = module.get<FallbackContactsController>(FallbackContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
