import { Test, TestingModule } from '@nestjs/testing';
import { InstallmentPlansController } from './installment_plans.controller';
import { InstallmentPlansService } from './installment_plans.service';
import { InstallmentPlanStatus } from './enums/installmentPlanStatus.enum';
import { PaymentType } from './enums/paymentType.enum';

describe('InstallmentPlansController', () => {
  let controller: InstallmentPlansController;
  let service: jest.Mocked<InstallmentPlansService>;

  beforeEach(async () => {
    service = {
      paginate: jest.fn(),
      create: jest.fn(),
      pay: jest.fn(),
      unpay: jest.fn(),
      freeze: jest.fn(),
      unfreeze: jest.fn(),
      updateNotes: jest.fn(),
    } as unknown as jest.Mocked<InstallmentPlansService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstallmentPlansController],
      providers: [{ provide: InstallmentPlansService, useValue: service }],
    }).compile();

    controller = module.get<InstallmentPlansController>(
      InstallmentPlansController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll with pagination and search params', () => {
    const query = {
      page: 2,
      limit: 20,
      status: InstallmentPlanStatus.Active,
      search: 'client',
    };

    controller.findAll(query as any);

    expect(service.paginate).toHaveBeenCalledWith(
      { page: 2, limit: 20 },
      InstallmentPlanStatus.Active,
      'client',
    );
  });

  it('delegates plan creation with account id from request', () => {
    const planDTO = {
      client_id: 'client-id',
      down_payment: 1000,
      duration_months: 12,
    } as any;
    const req = { user: { id: 'account-id' } };

    controller.create(planDTO, req);

    expect(service.create).toHaveBeenCalledWith(planDTO, 'account-id');
  });

  it('delegates payment recording', () => {
    const paymentDTO = {
      installment_plan_id: 'plan-id',
      paid_amount: 500,
      payment_type: PaymentType.Cash,
    };
    const req = { user: { id: 'account-id' } };

    controller.pay(paymentDTO, req);

    expect(service.pay).toHaveBeenCalledWith(paymentDTO, 'account-id');
  });

  it('delegates payment reversal', () => {
    const unpayDTO = { installment_plan_id: 'plan-id' };
    const req = { user: { id: 'account-id' } };

    controller.unpay(unpayDTO, req);

    expect(service.unpay).toHaveBeenCalledWith(unpayDTO, 'account-id');
  });

  it('delegates plan freeze and unfreeze', () => {
    const planId = 'plan-id';
    const req = { user: { id: 'account-id' } };

    controller.freeze(planId, req);
    controller.unfreeze(planId, req);

    expect(service.freeze).toHaveBeenCalledWith(planId, 'account-id');
    expect(service.unfreeze).toHaveBeenCalledWith(planId, 'account-id');
  });

  it('delegates notes update', () => {
    const planId = 'plan-id';
    const dto = { notes: 'updated notes' };
    const req = { user: { id: 'account-id' } };

    controller.updateNotes(planId, dto, req);

    expect(service.updateNotes).toHaveBeenCalledWith(
      planId,
      'updated notes',
      'account-id',
    );
  });
});
