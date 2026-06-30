import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { Repository } from 'typeorm';
import { CreateAccountDTO } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {}

  create(personId: string, createAccountDTO: CreateAccountDTO) {
    // If user is an admin (we know with token), then proceed no problem
    // Else (user is a client):
    //* If createAccountDTO.role is Role.Admin, get out (rejected)
    //* Else (createAccountDTO.role is Role.Client) we check whether the user is the personId
    
  }
}
