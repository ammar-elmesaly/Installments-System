import { Test, TestingModule } from '@nestjs/testing';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AdminLevel } from './enums/adminLevel.enum';

describe('AdminsController', () => {
  let controller: AdminsController;
  let service: jest.Mocked<AdminsService>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      paginate: jest.fn(),
    } as unknown as jest.Mocked<AdminsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminsController],
      providers: [{ provide: AdminsService, useValue: service }],
    }).compile();

    controller = module.get<AdminsController>(AdminsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('finds all admins with the requested pagination options', async () => {
    const pagination = { items: [], meta: {} } as any;
    service.paginate.mockResolvedValue(pagination);

    await expect(controller.findAll(2, 20)).resolves.toBe(pagination);
    expect(service.paginate).toHaveBeenCalledWith({ page: 2, limit: 20 });
  });

  it('caps the admin page size at 100', () => {
    controller.findAll(1, 200);

    expect(service.paginate).toHaveBeenCalledWith({ page: 1, limit: 100 });
  });

  it('delegates admin lookup, update, and removal', () => {
    const id = 'admin-id';
    const update = { admin_level: AdminLevel.Collector };

    controller.findById(id);
    controller.updateById(id, update);
    controller.removeById(id);

    expect(service.findById).toHaveBeenCalledWith(id);
    expect(service.updateById).toHaveBeenCalledWith(id, update);
    expect(service.deleteById).toHaveBeenCalledWith(id);
  });
});
