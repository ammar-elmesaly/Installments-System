import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsController } from './activity_logs.controller';
import { ActivityLogsService } from './activity_logs.service';

describe('ActivityLogsController', () => {
  let controller: ActivityLogsController;
  let service: { paginate: jest.Mock };

  beforeEach(async () => {
    service = {
      paginate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogsController],
      providers: [{ provide: ActivityLogsService, useValue: service }],
    }).compile();

    controller = module.get<ActivityLogsController>(ActivityLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates pagination with the requested page and limit', async () => {
    const pagination = { items: [], meta: {} };
    service.paginate.mockResolvedValue(pagination);

    await expect(controller.findAll(3, 25)).resolves.toBe(pagination);
    expect(service.paginate).toHaveBeenCalledWith({ page: 3, limit: 25 });
  });

  it('caps the requested limit at 100', async () => {
    service.paginate.mockResolvedValue({ items: [], meta: {} });

    await controller.findAll(1, 250);

    expect(service.paginate).toHaveBeenCalledWith({ page: 1, limit: 100 });
  });
});
