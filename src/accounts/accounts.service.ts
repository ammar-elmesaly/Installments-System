import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CreateAdminAccountDTO, CreateClientAccountDTO } from './dto/account.dto';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from '../auth/dto/login.dto';
import { Admin } from '../admins/admin.entity';
import { Role } from './enums/role';
import { Person } from '../people/person.entity';
import { Client } from '../clients/client.entity';
import { AdminLevel } from '../admins/enums/adminLevel.enum';
import { ClientStatus } from '../clients/enums/clientStatus.enum';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private dataSource: DataSource
  ) {}

  updateTokenVersion(accountId: string, tokenVersion: number): Promise<UpdateResult> {
    return this.accountRepository.update({ id: accountId }, { token_version: tokenVersion });
  }

  async createAdmin(createAccountDTO: CreateAdminAccountDTO): Promise<Account> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const duplicateAccount = await queryRunner.manager.findOneBy(Account, {
        email: createAccountDTO.email
      })

      if (duplicateAccount) {
        throw new ConflictException('An account with this email already exists.');
      }

      const duplicatePerson = await queryRunner.manager.findOne(Person, {
        where: [
          {
            first_name: createAccountDTO.first_name,
            second_name: createAccountDTO.second_name,
            third_name: createAccountDTO.third_name,
            last_name: createAccountDTO.last_name,
          },
          { phone_number: createAccountDTO.phone_number },
        ],
      });

      if (duplicatePerson) {
        if (duplicatePerson.phone_number === createAccountDTO.phone_number) {
          throw new ConflictException('This phone number is already registered.');
        }

        throw new ConflictException('A person with this exact full name already exists.');
      }

      const person = queryRunner.manager.create(Person, createAccountDTO);
      const savedPerson = await queryRunner.manager.save(person);

      await queryRunner.manager.save(Admin, queryRunner.manager.create(Admin, {
        person: savedPerson,
        admin_level: createAccountDTO.admin_level ?? AdminLevel.Auditor,
      }));

      const account = queryRunner.manager.create(Account);

      account.person = savedPerson;
      account.email = createAccountDTO.email;
      account.role = Role.Admin;
      account.password_hash = await bcrypt.hash(createAccountDTO.password, 12);

      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      delete savedAccount.password_hash;
      delete savedAccount.token_version;
      
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
      const duplicateAccount = await queryRunner.manager.findOneBy(Account, {
        email: createAccountDTO.email
      })

      if (duplicateAccount) {
        throw new ConflictException('An account with this email already exists.');
      }

      const duplicatePerson = await queryRunner.manager.findOne(Person, {
        where: [
          {
            first_name: createAccountDTO.first_name,
            second_name: createAccountDTO.second_name,
            third_name: createAccountDTO.third_name,
            last_name: createAccountDTO.last_name,
          },
          { phone_number: createAccountDTO.phone_number },
        ],
      });

      if (duplicatePerson) {
        if (duplicatePerson.phone_number === createAccountDTO.phone_number) {
          throw new ConflictException('This phone number is already registered.');
        }

        throw new ConflictException('A person with this exact full name already exists.');
      }

      const person = queryRunner.manager.create(Person, createAccountDTO);
      const savedPerson = await queryRunner.manager.save(person);

      await queryRunner.manager.save(Client, queryRunner.manager.create(Client, {
        person: savedPerson,
        total_paid_cash: createAccountDTO.total_paid_cash ?? 0,
        client_status: createAccountDTO.client_status ?? ClientStatus.Active,
      }));

      const account = queryRunner.manager.create(Account);

      account.person = savedPerson;
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

  async findById(accountId: string): Promise<Account> {
    const account = await this.accountRepository.findOneBy({ id: accountId });
    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    return account;
  }
  
  async findByEmail(
    loginDTO: LoginDTO,
    exception = new NotFoundException(`No account with this email was found.`)
  ): Promise<Account> {
    const account = await this.accountRepository.findOneBy({ email: loginDTO.email });
    if (!account) {
      throw exception;
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
