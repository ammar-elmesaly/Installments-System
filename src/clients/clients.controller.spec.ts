import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientStatus } from './enums/clientStatus.enum';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: jest.Mocked<ClientsService>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      paginate: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<ClientsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: service }],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll with pagination and search params', () => {
    const query = { page: 2, limit: 20, status: ClientStatus.Active, search: 'john' };

    controller.findAll(query as any);

    expect(service.paginate).toHaveBeenCalledWith(
      { page: 2, limit: 20 },
      ClientStatus.Active,
      'john'
    );
  });

  it('delegates findById', () => {
    const id = 'client-id';

    controller.findById(id);

    expect(service.findById).toHaveBeenCalledWith(id);
  });

  it('delegates client creation with account id', () => {
    const dto = { first_name: 'John', last_name: 'Doe', phone_number: '01234567890' } as any;
    const req = { user: { id: 'account-id' } };

    controller.create(dto, req);

    expect(service.create).toHaveBeenCalledWith(dto, 'account-id');
  });

  it('delegates client update with account id', () => {
    const id = 'client-id';
    const dto = { first_name: 'Jane' } as any;
    const req = { user: { id: 'account-id' } };

    controller.updateById(id, dto, req);

    expect(service.updateById).toHaveBeenCalledWith(id, dto, 'account-id');
  });

  it('delegates client removal with account id', () => {
    const id = 'client-id';
    const req = { user: { id: 'account-id' } };

    controller.removeById(id, req);

    expect(service.deleteById).toHaveBeenCalledWith(id, 'account-id');
  });
});
