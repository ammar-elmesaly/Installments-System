import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import {
  CreateAdminAccountDTO,
  CreateClientAccountDTO,
} from '../accounts/dto/account.dto';
import { LoginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../accounts/enums/role';
import { AdminLevel } from '../admins/enums/adminLevel.enum';
import { PayloadType } from './types/payload.type';

@Injectable()
export class AuthService {
  constructor(
    private accountsService: AccountsService,
    private jwtService: JwtService,
  ) {}

  signup(createAccountDTO: CreateClientAccountDTO) {
    return this.accountsService.createClient(createAccountDTO);
  }

  signupAdmin(createAccountDTO: CreateAdminAccountDTO) {
    return this.accountsService.createAdmin(createAccountDTO);
  }

  async login(loginDTO: LoginDTO): Promise<{ access_token: string }> {
    const account = await this.accountsService.findByEmail(
      loginDTO,
      new UnauthorizedException(
        'Wrong email or password, please recheck your credentials',
      ),
    );

    const validPassword = await bcrypt.compare(
      loginDTO.password,
      account.password_hash,
    );
    if (!validPassword) {
      throw new UnauthorizedException(
        'Wrong email or password, please recheck your credentials',
      );
    }

    let adminLevel: AdminLevel;
    let name = account.email;

    if (account.role === Role.Admin) {
      const admin = await this.accountsService.getAdminByAccountId(account.id);
      adminLevel = admin.admin_level;
      name = [
        admin.person.first_name,
        admin.person.second_name,
        admin.person.third_name,
        admin.person.last_name,
      ]
        .filter(Boolean)
        .join(' ');
    }

    account.token_version += 1;

    await this.accountsService.updateTokenVersion(
      account.id,
      account.token_version,
    );

    const payload: PayloadType = {
      token_version: account.token_version,
      email: account.email,
      name,
      role: account.role,
      admin_level: adminLevel,
      id: account.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
