import { Test, TestingModule } from '@nestjs/testing';
import { AdminsService } from './admins.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { Person } from '../people/person.entity';
import { AdminLevel } from './enums/adminLevel.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

describe('AdminsService', () => {
  let service: AdminsService;
  let repository: { find: jest.Mock; findOne: jest.Mock; manager: any };
  let dataSource: { createQueryRunner: jest.Mock };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      manager: { getRepository: jest.fn() },
    };
    dataSource = { createQueryRunner: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        { provide: getRepositoryToken(Admin), useValue: repository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds all admins with their people', async () => {
    const admins = [{ id: 'admin-id' } as Admin];
    repository.find.mockResolvedValue(admins);

    await expect(service.findAll()).resolves.toBe(admins);
    expect(repository.find).toHaveBeenCalledWith({ relations: { person: true } });
  });

  it('finds an admin by id and throws when it does not exist', async () => {
    const admin = { id: 'admin-id' } as Admin;
    repository.findOne.mockResolvedValueOnce(admin).mockResolvedValueOnce(null);

    await expect(service.findById(admin.id)).resolves.toBe(admin);
    await expect(service.findById(admin.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an admin in a local transaction', async () => {
    const queryRunner = createQueryRunner();
    const person = { id: 'person-id' } as Person;
    const admin = { id: 'admin-id', person } as Admin;
    queryRunner.manager.findOne.mockResolvedValue(null);
    queryRunner.manager.create.mockReturnValueOnce(person).mockReturnValueOnce(admin);
    queryRunner.manager.save.mockResolvedValueOnce(person).mockResolvedValueOnce(admin);
    queryRunner.isTransactionActive = false;
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(createAdminDTO())).resolves.toBe(admin);
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('rejects duplicate admin phone numbers', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOne.mockResolvedValue({ phone_number: '01000000000' });
    queryRunner.isTransactionActive = false;
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.create(createAdminDTO())).rejects.toBeInstanceOf(ConflictException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('updates an admin and its person in a transaction', async () => {
    const queryRunner = createQueryRunner();
    const admin = { id: 'admin-id', person: {} as Person } as Admin;
    queryRunner.manager.findOne.mockResolvedValue(admin);
    queryRunner.manager.save.mockResolvedValue(admin);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.updateById(admin.id, {
      first_name: 'Updated',
      admin_level: AdminLevel.SuperAdmin,
    })).resolves.toBe(admin);
    expect(queryRunner.manager.merge).toHaveBeenCalledWith(Person, admin.person, { first_name: 'Updated' });
    expect(queryRunner.manager.merge).toHaveBeenCalledWith(Admin, admin, { admin_level: AdminLevel.SuperAdmin });
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('throws when updating or deleting a missing admin', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.manager.findOne.mockResolvedValue(null);
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.updateById('missing-id', {})).rejects.toBeInstanceOf(NotFoundException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();

    const manager = { getRepository: jest.fn() };
    manager.getRepository.mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(service.deleteById('missing-id', manager)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes the person belonging to an admin', async () => {
    const person = { id: 'person-id' } as Person;
    const remove = jest.fn().mockResolvedValue(person);
    const manager = { getRepository: jest.fn() };
    manager.getRepository.mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue({ person }) });
    manager.getRepository.mockReturnValueOnce({ remove });

    await expect(service.deleteById('admin-id', manager)).resolves.toBe(person);
    expect(remove).toHaveBeenCalledWith(person);
  });
});

function createQueryRunner() {
  return {
    isTransactionActive: true,
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
    },
  } as any;
}

function createAdminDTO() {
  return {
    first_name: 'Test',
    second_name: 'Admin',
    third_name: 'Middle',
    last_name: 'User',
    phone_number: '01000000000',
  };
}
