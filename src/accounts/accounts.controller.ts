import { Body, Controller, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDTO } from './dto/account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post('new')
  create(@Body() createAccountDTO: CreateAccountDTO) {
    return this.accountsService.create(createAccountDTO);
  }
}
