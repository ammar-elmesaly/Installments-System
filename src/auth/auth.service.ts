import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { CreateAdminAccountDTO, CreateClientAccountDTO } from '../accounts/dto/account.dto';
import { LoginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor (
    private accountsService: AccountsService
  ) {}

  signup(createAccountDTO: CreateClientAccountDTO) {
    return this.accountsService.createClient(createAccountDTO);
  }

  signupAdmin(createAccountDTO: CreateAdminAccountDTO) {
    return this.accountsService.createAdmin(createAccountDTO);
  }

  async login(loginDTO: LoginDTO) {
    const account = await this.accountsService.findByEmail(loginDTO);

    const validPassword = await bcrypt.compare(loginDTO.password, account.password_hash);
    if (!validPassword) {
      throw new UnauthorizedException('Wrong email or password, please recheck your credentials');
    }

  }
}
