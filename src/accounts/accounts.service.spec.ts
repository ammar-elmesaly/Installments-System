import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Role } from './enums/role';
import { AdminLevel } from '../admins/enums/adminLevel.enum';
import { ClientStatus } from '../clients/enums/clientStatus.enum';

jest.mock('bcrypt');

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: {
    update: jest.Mock;
    findOneBy: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: { createQueryRunner: jest.Mock };
  let compareMock: jest.Mock;

  beforeEach(async () => {
    repository = {
      update: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = { createQueryRunner: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getRepositoryToken(Account), useValue: repository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    const bcrypt = require('bcrypt');
    compareMock = bcrypt.compare;
    compareMock.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates token version for an account', async () => {
    repository.update.mockResolvedValue({ affected: 1 });

    await service.updateTokenVersion('account-id', 2);

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'account-id' },
      { token_version: 2 },
    );
  });

  it('creates an admin account with transaction', async () => {
    const queryRunner = createQueryRunner();
    const bcrypt = require('bcrypt');
    bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
    queryRunner.manager.findOneBy.mockResolvedValueOnce(null);
    queryRunner.manager.findOne.mockResolvedValueOnce(null);

    const person = {
      id: 'person-id',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '01234567890',
    };
    const admin = { id: 'admin-id', person, admin_level: AdminLevel.Auditor };
    const account = {
      id: 'account-id',
      email: 'john@example.com',
      role: Role.Admin,
      person,
    };

    queryRunner.manager.create
      .mockReturnValueOnce(person)
      .mockReturnValueOnce(admin)
      .mockReturnValueOnce(account);
    queryRunner.manager.save
      .mockResolvedValueOnce(person)
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce({
        ...account,
        password_hash: 'hashed-password',
        token_version: 0,
      });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'John',
      second_name: '',
      third_name: '',
      last_name: 'Doe',
      phone_number: '01234567890',
      email: 'john@example.com',
      password: 'password123',
      admin_level: AdminLevel.Auditor,
    };

    const result = await service.createAdmin(dto);

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(result.password_hash).toBeUndefined();
    expect(result.token_version).toBeUndefined();
  });

  it('rejects duplicate email on admin account creation', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOneBy.mockResolvedValueOnce({
      id: 'duplicate-account-id',
    });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'John',
      second_name: '',
      third_name: '',
      last_name: 'Doe',
      phone_number: '01234567890',
      email: 'john@example.com',
      password: 'password123',
    };

    await expect(service.createAdmin(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('rejects duplicate phone number on admin account creation', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOneBy.mockResolvedValueOnce(null);
    queryRunner.manager.findOne.mockResolvedValueOnce({
      phone_number: '01234567890',
      first_name: 'Jane',
    });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'John',
      second_name: '',
      third_name: '',
      last_name: 'Doe',
      phone_number: '01234567890',
      email: 'john@example.com',
      password: 'password123',
    };

    await expect(service.createAdmin(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('rejects duplicate full name on admin account creation', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOneBy.mockResolvedValueOnce(null);
    queryRunner.manager.findOne.mockResolvedValueOnce({
      first_name: 'John',
      second_name: 'M',
      third_name: 'P',
      last_name: 'Doe',
      phone_number: '09999999999',
    });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'John',
      second_name: 'M',
      third_name: 'P',
      last_name: 'Doe',
      phone_number: '01234567890',
      email: 'john@example.com',
      password: 'password123',
    };

    await expect(service.createAdmin(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('creates a client account with transaction', async () => {
    const queryRunner = createQueryRunner();
    const bcrypt = require('bcrypt');
    bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
    queryRunner.manager.findOneBy.mockResolvedValueOnce(null);
    queryRunner.manager.findOne.mockResolvedValueOnce(null);

    const person = {
      id: 'person-id',
      first_name: 'Jane',
      last_name: 'Smith',
      phone_number: '01234567890',
    };
    const client = {
      id: 'client-id',
      person,
      total_paid_cash: 0,
      client_status: ClientStatus.Active,
    };
    const account = {
      id: 'account-id',
      email: 'jane@example.com',
      role: Role.Client,
      person,
    };

    queryRunner.manager.create
      .mockReturnValueOnce(person)
      .mockReturnValueOnce(client)
      .mockReturnValueOnce(account);
    queryRunner.manager.save
      .mockResolvedValueOnce(person)
      .mockResolvedValueOnce(client)
      .mockResolvedValueOnce({ ...account, password_hash: 'hashed-password' });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'Jane',
      second_name: '',
      third_name: '',
      last_name: 'Smith',
      phone_number: '01234567890',
      email: 'jane@example.com',
      password: 'password123',
      total_paid_cash: 0,
      client_status: ClientStatus.Active,
    };

    const result = await service.createClient(dto);

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(result.password_hash).toBeUndefined();
  });

  it('rejects duplicate email on client account creation', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOneBy.mockResolvedValueOnce({
      id: 'duplicate-account-id',
    });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'Jane',
      second_name: '',
      third_name: '',
      last_name: 'Smith',
      phone_number: '01234567890',
      email: 'jane@example.com',
      password: 'password123',
    };

    await expect(service.createClient(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('rejects duplicate phone number on client account creation', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOneBy.mockResolvedValueOnce(null);
    queryRunner.manager.findOne.mockResolvedValueOnce({
      phone_number: '01234567890',
      first_name: 'Someone',
    });
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    const dto = {
      first_name: 'Jane',
      second_name: '',
      third_name: '',
      last_name: 'Smith',
      phone_number: '01234567890',
      email: 'jane@example.com',
      password: 'password123',
    };

    await expect(service.createClient(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('finds account by id and throws when not found', async () => {
    const account = { id: 'account-id', email: 'test@example.com' };
    repository.findOneBy
      .mockResolvedValueOnce(account)
      .mockResolvedValueOnce(null);

    await expect(service.findById('account-id')).resolves.toEqual(account);
    await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('finds account by email and throws when not found', async () => {
    const account = { id: 'account-id', email: 'test@example.com' };
    const loginDTO = { email: 'test@example.com', password: 'password123' };
    repository.findOneBy
      .mockResolvedValueOnce(account)
      .mockResolvedValueOnce(null);

    await expect(service.findByEmail(loginDTO)).resolves.toEqual(account);
    await expect(service.findByEmail(loginDTO)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('finds account by email with custom exception', async () => {
    const customException = new NotFoundException('Custom error message');
    const loginDTO = { email: 'test@example.com', password: 'password123' };
    repository.findOneBy.mockResolvedValueOnce(null);

    await expect(service.findByEmail(loginDTO, customException)).rejects.toBe(
      customException,
    );
  });

  it('finds admin by account id with relations', async () => {
    const admin = { id: 'admin-id', admin_level: AdminLevel.SuperAdmin };
    const account = {
      id: 'account-id',
      person: { admin },
    };
    repository.findOne.mockResolvedValue(account);

    const result = await service.getAdminByAccountId('account-id');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      relations: {
        person: {
          admin: true,
        },
      },
    });
    expect(result).toEqual(admin);
  });

  it('throws when admin is not associated with account', async () => {
    const account = {
      id: 'account-id',
      person: { admin: null },
    };
    repository.findOne.mockResolvedValue(account);

    await expect(
      service.getAdminByAccountId('account-id'),
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
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  } as any;
}
