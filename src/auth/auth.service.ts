import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { CreateAdminAccountDTO, CreateClientAccountDTO } from '../accounts/dto/account.dto';
import { LoginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../accounts/enums/role';
import { AdminLevel } from '../admins/enums/adminLevel.enum';
import { PayloadType } from './types/payload.type';

@Injectable()
export class AuthService {
  constructor (
    private accountsService: AccountsService,
    private jwtService: JwtService
  ) {}

  signup(createAccountDTO: CreateClientAccountDTO) {
    return this.accountsService.createClient(createAccountDTO);
  }

  signupAdmin(createAccountDTO: CreateAdminAccountDTO) {
    return this.accountsService.createAdmin(createAccountDTO);
  }

  async login(loginDTO: LoginDTO): Promise<{ access_token: string }> {
    const account = await this.accountsService.findByEmail(loginDTO);

    const validPassword = await bcrypt.compare(loginDTO.password, account.password_hash);
    if (!validPassword) {
      throw new UnauthorizedException('Wrong email or password, please recheck your credentials');
    }

    let adminLevel: AdminLevel;
    if (account.role === Role.Admin) {
      const admin = await this.accountsService.getAdminByAccountId(account.id);
      adminLevel = admin.admin_level;
    }

    const payload: PayloadType = { email: account.email, role: account.role, admin_level: adminLevel, id: account.id };

    console.log(payload);
    return {
      access_token: this.jwtService.sign(payload)
    }
  }
}
