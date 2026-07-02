import { Body, Controller, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDTO, CreateAdminAccountDTO, CreateClientAccountDTO } from './dto/account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post('new/admin')
  createAdmin(@Body() createAccountDTO: CreateAdminAccountDTO) {
    return this.accountsService.createAdmin(createAccountDTO);
  }

  @Post('new/client')
  createClient(@Body() createAccountDTO: CreateClientAccountDTO) {
    return this.accountsService.createClient(createAccountDTO);
  }
}
