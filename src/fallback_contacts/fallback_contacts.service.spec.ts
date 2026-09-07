import { Test, TestingModule } from '@nestjs/testing';
import { FallbackContactsService } from './fallback_contacts.service';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FallbackContact } from './fallback_contact.entity';

describe('FallbackContactsService', () => {
  let service: FallbackContactsService;
  let dataSource: { createQueryRunner: jest.Mock };
  let repository: { findOne: jest.Mock; find: jest.Mock; createQueryBuilder: jest.Mock; manager: any };
  let fallbackContactsService: jest.Mocked<FallbackContactsService>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { findOne: jest.fn() },
    };
    dataSource = { createQueryRunner: jest.fn() };
    fallbackContactsService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<FallbackContactsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackContactsService,
        { provide: getRepositoryToken(FallbackContact), useValue: repository },
        { provide: DataSource, useValue: dataSource },
        { provide: FallbackContactsService, useValue: fallbackContactsService },
      ],
    }).compile();

    service = module.get<FallbackContactsService>(FallbackContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
