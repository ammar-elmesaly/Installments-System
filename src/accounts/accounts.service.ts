import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { Repository } from 'typeorm';
import { CreateAdminAccountDTO, CreateClientAccountDTO } from './dto/account.dto';
import { AdminsService } from '../admins/admins.service';
import { ClientsService } from '../clients/clients.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from '../auth/dto/login.dto';
import { Admin } from '../admins/admin.entity';
import { Role } from './enums/role';

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
      const duplicateAccount = await this.accountRepository.findOne({
        where: {
          email: createAccountDTO.email
        }
      })

      if (duplicateAccount) {
        throw new ConflictException('An account with this email already exists.');
      }

      const admin = await this.adminsService.create(createAccountDTO, queryRunner);
      const account = queryRunner.manager.create(Account);

      account.person = admin.person;
      account.email = createAccountDTO.email;
      account.role = Role.Admin;
      account.password_hash = await bcrypt.hash(createAccountDTO.password, 12);

      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      delete savedAccount.password_hash;
      
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
      account.role = Role.Client;
      account.password_hash = await bcrypt.hash(createAccountDTO.password, 12);

      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();
      
      delete savedAccount.password_hash;
      
      return savedAccount;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByEmail(loginDTO: LoginDTO): Promise<Account> {
    const account = await this.accountRepository.findOneBy({ email: loginDTO.email });
    if (!account) {
      throw new NotFoundException(`No Account with this email was found`);
    }
    return account;
  }

  async getAdminByAccountId(accountId: string): Promise<Admin> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: {
        person: {
          admin: true
        }
      }
    });

    if (!account.person.admin) {
      throw new NotFoundException(`No Admin associated with this account was found`);
    }

    return account.person.admin;
  }
}
