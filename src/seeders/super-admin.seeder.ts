import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { Role } from '../accounts/enums/role';
import { Admin } from '../admins/admin.entity';
import { AdminLevel } from '../admins/enums/adminLevel.enum';
import { Person } from '../people/person.entity';
import { SuperAdminSeedConfig } from './super-admin.seed.config';

export class SuperAdminSeeder {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: SuperAdminSeedConfig,
  ) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accountRepository = queryRunner.manager.getRepository(Account);
      const personRepository = queryRunner.manager.getRepository(Person);
      const adminRepository = queryRunner.manager.getRepository(Admin);

      const existingAccount = await accountRepository.findOne({
        where: { email: this.config.email },
        relations: {
          person: {
            admin: true,
          },
        },
      });

      const existingPerson = existingAccount
        ? existingAccount.person
        : await personRepository.findOne({
            where: { phone_number: this.config.person.phone_number },
            relations: {
              account: true,
              admin: true,
            },
          });

      const person = existingPerson ?? personRepository.create();
      person.first_name = this.config.person.first_name;
      person.second_name = this.config.person.second_name;
      person.third_name = this.config.person.third_name;
      person.last_name = this.config.person.last_name;
      person.phone_number = this.config.person.phone_number;
      person.nick_name = this.config.person.nick_name;
      person.profession = this.config.person.profession;
      person.address = this.config.person.address;
      person.image_path = this.config.person.image_path;

      const savedPerson = await personRepository.save(person);

      const admin = existingAccount?.person?.admin ?? existingPerson?.admin ?? adminRepository.create();
      admin.person = savedPerson;
      admin.admin_level = AdminLevel.SuperAdmin;
      await adminRepository.save(admin);

      const account = existingAccount ?? existingPerson?.account ?? accountRepository.create();
      account.person = savedPerson;
      account.email = this.config.email;
      account.role = Role.Admin;
      account.password_hash = await this.resolvePasswordHash(existingAccount ?? existingPerson?.account);

      await accountRepository.save(account);

      await queryRunner.commitTransaction();
      console.log(`[seed-super-admin] Super Admin ready for ${this.config.email}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async resolvePasswordHash(existingAccount?: Account): Promise<string> {
    if (!existingAccount?.password_hash) {
      return bcrypt.hash(this.config.password, 12);
    }

    const passwordMatches = await bcrypt.compare(this.config.password, existingAccount.password_hash);

    if (passwordMatches) {
      return existingAccount.password_hash;
    }

    return bcrypt.hash(this.config.password, 12);
  }
}