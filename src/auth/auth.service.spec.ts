import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AccountsService } from '../accounts/accounts.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../accounts/enums/role';
import { AdminLevel } from '../admins/enums/adminLevel.enum';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let accountsService: jest.Mocked<AccountsService>;
  let jwtService: jest.Mocked<JwtService>;
  let compareMock: jest.MockedFunction<typeof bcrypt.compare>;

  beforeEach(async () => {
    accountsService = {
      createClient: jest.fn(),
      createAdmin: jest.fn(),
      findByEmail: jest.fn(),
      getAdminByAccountId: jest.fn(),
      updateTokenVersion: jest.fn(),
    } as unknown as jest.Mocked<AccountsService>;
    jwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
    compareMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AccountsService, useValue: accountsService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates client and admin signup', () => {
    const clientAccount = { email: 'client@example.com' } as any;
    const adminAccount = { email: 'admin@example.com' } as any;

    service.signup(clientAccount);
    service.signupAdmin(adminAccount);

    expect(accountsService.createClient).toHaveBeenCalledWith(clientAccount);
    expect(accountsService.createAdmin).toHaveBeenCalledWith(adminAccount);
  });

  it('logs in a client and signs a token with the incremented version', async () => {
    const login = { email: 'client@example.com', password: 'Password123' };
    const account = {
      id: 'account-id',
      email: login.email,
      password_hash: 'hashed-password',
      role: Role.Client,
      token_version: 2,
    };
    accountsService.findByEmail.mockResolvedValue(account as any);
    compareMock.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('signed-token');

    await expect(service.login(login)).resolves.toEqual({ access_token: 'signed-token' });
    expect(accountsService.updateTokenVersion).toHaveBeenCalledWith('account-id', 3);
    expect(jwtService.sign).toHaveBeenCalledWith({
      token_version: 3,
      email: login.email,
      role: Role.Client,
      admin_level: undefined,
      id: 'account-id',
    });
  });

  it('includes the admin level when an admin logs in', async () => {
    const login = { email: 'admin@example.com', password: 'Password123' };
    const account = {
      id: 'admin-account-id',
      email: login.email,
      password_hash: 'hashed-password',
      role: Role.Admin,
      token_version: 0,
    };
    accountsService.findByEmail.mockResolvedValue(account as any);
    accountsService.getAdminByAccountId.mockResolvedValue({ admin_level: AdminLevel.SuperAdmin } as any);
    compareMock.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('admin-token');

    await expect(service.login(login)).resolves.toEqual({ access_token: 'admin-token' });
    expect(accountsService.getAdminByAccountId).toHaveBeenCalledWith('admin-account-id');
    expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
      role: Role.Admin,
      admin_level: AdminLevel.SuperAdmin,
      token_version: 1,
    }));
  });

  it('rejects invalid passwords without updating the token version', async () => {
    const login = { email: 'client@example.com', password: 'wrong-password' };
    accountsService.findByEmail.mockResolvedValue({
      id: 'account-id',
      password_hash: 'hashed-password',
      role: Role.Client,
      token_version: 1,
    } as any);
    compareMock.mockResolvedValue(false);

    await expect(service.login(login)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(accountsService.updateTokenVersion).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('uses the unauthorized error when the account cannot be found', async () => {
    const login = { email: 'missing@example.com', password: 'Password123' };
    accountsService.findByEmail.mockRejectedValue(new UnauthorizedException());

    await expect(service.login(login)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compareMock).not.toHaveBeenCalled();
  });
});
