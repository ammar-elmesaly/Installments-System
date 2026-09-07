import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../accounts/enums/role';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    service = {
      signup: jest.fn(),
      signupAdmin: jest.fn(),
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates client signup', () => {
    const account = { email: 'client@example.com', role: Role.Client } as any;

    controller.createClient(account);

    expect(service.signup).toHaveBeenCalledWith(account);
  });

  it('delegates admin signup', () => {
    const account = { email: 'admin@example.com' } as any;

    controller.createAdmin(account);

    expect(service.signupAdmin).toHaveBeenCalledWith(account);
  });

  it('delegates login', () => {
    const credentials = { email: 'user@example.com', password: 'Password123' };

    controller.login(credentials);

    expect(service.login).toHaveBeenCalledWith(credentials);
  });
});
