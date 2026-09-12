import { Test, TestingModule } from '@nestjs/testing';
import { FallbackContactsController } from './fallback_contacts.controller';
import { FallbackContactsService } from './fallback_contacts.service';

describe('FallbackContactsController', () => {
  let controller: FallbackContactsController;
  let service: jest.Mocked<FallbackContactsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FallbackContactsController],
      providers: [{ provide: FallbackContactsService, useValue: service }],
    }).compile();

    controller = module.get<FallbackContactsController>(
      FallbackContactsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
