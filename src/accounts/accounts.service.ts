import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { Repository } from 'typeorm';
import { CreateAdminAccountDTO, CreateClientAccountDTO } from './dto/account.dto';
import { AdminsService } from '../admins/admins.service';
import { ClientsService } from '../clients/clients.service';
import { Role } from './enums/role';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private adminsService: AdminsService,
    private clientsService: ClientsService,
    private dataSource: DataSource
  ) {}

  // If user is an admin (we know with token), then proceed no problem
  // Else (user is a client):
  //* If createAccountDTO.role is Role.Admin, get out (rejected)
  //* Else (createAccountDTO.role is Role.Client) we check whether the user is the personId

  async createAdmin(createAccountDTO: CreateAdminAccountDTO): Promise<Account> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const admin = await this.adminsService.create(createAccountDTO, queryRunner);
      const account = queryRunner.manager.create(Account);

      account.person = admin.person;
      account.email = createAccountDTO.email;
      account.role = createAccountDTO.role;
      account.password_hash = await bcrypt.hash(createAccountDTO.password, 12);

      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      return savedAccount;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createClient(createAccountDTO: CreateClientAccountDTO): Promise<Account> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = await this.clientsService.create(createAccountDTO, queryRunner);
      const account = queryRunner.manager.create(Account);

      account.person = client.person;
      account.email = createAccountDTO.email;
      account.role = createAccountDTO.role;
      account.password_hash = await bcrypt.hash(createAccountDTO.password, 12);

      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      return savedAccount;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
