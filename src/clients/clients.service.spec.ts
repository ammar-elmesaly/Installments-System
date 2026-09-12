import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { DataSource } from 'typeorm';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';
import { ClientStatus } from './enums/clientStatus.enum';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: {
    findOne: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
    manager: any;
  };
  let dataSource: { createQueryRunner: jest.Mock };
  let activityLogsService: jest.Mocked<ActivityLogsService>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { findOne: jest.fn() },
    };
    dataSource = { createQueryRunner: jest.fn() };
    activityLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ActivityLogsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: repository },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds all clients with their people', async () => {
    const clients = [{ id: 'client-id', person: {} } as Client];
    repository.find.mockResolvedValue(clients);

    await expect(service.findAll()).resolves.toBe(clients);
    expect(repository.find).toHaveBeenCalledWith({
      relations: { person: true },
    });
  });

  it('finds a client by id and throws when it does not exist', async () => {
    const client = { id: 'client-id', person: {} } as Client;
    repository.findOne
      .mockResolvedValueOnce(client)
      .mockResolvedValueOnce(null);

    await expect(service.findById(client.id)).resolves.toBe(client);
    await expect(service.findById(client.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a client in a local transaction and logs the action', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '01234567890',
    } as any;
    const person = { id: 'person-id', ...dto };
    const client = { id: 'client-id', person } as any;
    queryRunner.isTransactionActive = false;
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ person: { admin: {} } })
      .mockResolvedValueOnce(null);
    queryRunner.manager.create
      .mockReturnValueOnce(person)
      .mockReturnValueOnce(client);
    queryRunner.manager.save
      .mockResolvedValueOnce(person)
      .mockResolvedValueOnce(client);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(dto, 'account-id')).resolves.toBe(client);
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(activityLogsService.log).toHaveBeenCalled();
  });

  it('rejects duplicate phone numbers on client creation', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '01234567890',
    } as any;
    queryRunner.isTransactionActive = false;
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ person: { admin: {} } })
      .mockResolvedValueOnce({ phone_number: '01234567890' });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(dto, 'account-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('rejects duplicate full names on client creation', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      first_name: 'John',
      second_name: 'M',
      third_name: 'P',
      last_name: 'Doe',
      phone_number: '01234567890',
    } as any;
    queryRunner.isTransactionActive = false;
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ person: { admin: {} } })
      .mockResolvedValueOnce({
        first_name: 'John',
        second_name: 'M',
        third_name: 'P',
        last_name: 'Doe',
      });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(dto, 'account-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('throws when admin is not found on creation', async () => {
    const queryRunner = createQueryRunner();
    const dto = {
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '01234567890',
    } as any;
    queryRunner.isTransactionActive = false;
    queryRunner.manager.findOne.mockResolvedValueOnce(null);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(dto, 'account-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('updates client and person fields with transaction', async () => {
    const queryRunner = createQueryRunner();
    const client = {
      id: 'client-id',
      person: { first_name: 'John', phone_number: '01234567890' },
      client_status: ClientStatus.Active,
    } as any;
    const dto = {
      first_name: 'Jane',
      client_status: ClientStatus.Inactive,
    } as any;
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ person: { admin: {} } })
      .mockResolvedValueOnce(client);
    queryRunner.manager.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });
    queryRunner.manager.merge.mockImplementation((entity, target, values) =>
      Object.assign(target, values),
    );
    queryRunner.manager.save.mockResolvedValue(client);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await service.updateById('client-id', dto, 'account-id');

    expect(queryRunner.manager.merge).toHaveBeenCalledWith(
      expect.anything(),
      client.person,
      { first_name: 'Jane' },
    );
    expect(queryRunner.manager.merge).toHaveBeenCalledWith(
      expect.anything(),
      client,
      { client_status: ClientStatus.Inactive },
    );
    expect(activityLogsService.log).toHaveBeenCalled();
  });

  it('throws when client is not found on update', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOne
      .mockResolvedValueOnce({ person: { admin: {} } })
      .mockResolvedValueOnce(null);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.updateById('missing-id', {}, 'account-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('deletes a client and logs the action', async () => {
    const client = {
      id: 'client-id',
      person: { id: 'person-id', first_name: 'John', last_name: 'Doe' },
    } as any;
    const manager = { findOne: jest.fn(), getRepository: jest.fn() };
    const personRepo = { remove: jest.fn().mockResolvedValue(client.person) };
    const clientRepo = { findOne: jest.fn().mockResolvedValue(client) };
    manager.findOne.mockResolvedValue({ person: { admin: {} } });
    manager.getRepository
      .mockReturnValueOnce(clientRepo)
      .mockReturnValueOnce(personRepo);

    await service.deleteById('client-id', 'account-id', manager as any);

    expect(personRepo.remove).toHaveBeenCalledWith(client.person);
    expect(activityLogsService.log).toHaveBeenCalled();
  });

  it('throws when client is not found on delete', async () => {
    const manager = { findOne: jest.fn(), getRepository: jest.fn() };
    const clientRepo = { findOne: jest.fn().mockResolvedValue(null) };
    manager.findOne.mockResolvedValue({ person: { admin: {} } });
    manager.getRepository.mockReturnValueOnce(clientRepo);

    await expect(
      service.deleteById('missing-id', 'account-id', manager as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createQueryRunner() {
  return {
    isTransactionActive: false,
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      createQueryBuilder: jest.fn(),
      getRepository: jest.fn(),
    },
  } as any;
}
