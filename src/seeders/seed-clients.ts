import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../datasource';
import { Account } from '../accounts/account.entity';
import { Role } from '../accounts/enums/role';
import { Client } from '../clients/client.entity';
import { ClientStatus } from '../clients/enums/clientStatus.enum';
import { Person } from '../people/person.entity';
import { createArabicClient, GeneratedClient } from './factories/client.factory';

const defaultClientCount = 10000;
const defaultBatchSize = 1000;
const defaultPassword = 'ClientPassword123!';

function readPositiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`[seed-clients] ${name} must be a positive integer`);
  }

  return value;
}

async function seedClients(): Promise<void> {
  const count = readPositiveInteger('SEED_CLIENT_COUNT', defaultClientCount);
  const batchSize = readPositiveInteger('SEED_CLIENT_BATCH_SIZE', defaultBatchSize);
  const password = process.env.SEED_CLIENT_PASSWORD ?? defaultPassword;
  const passwordHash = await bcrypt.hash(password, 12);

  await AppDataSource.initialize();
  await AppDataSource.synchronize();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const accountRepository = queryRunner.manager.getRepository(Account);
    const personRepository = queryRunner.manager.getRepository(Person);
    const clientRepository = queryRunner.manager.getRepository(Client);
    const existingAccounts = await accountRepository
      .createQueryBuilder('account')
      .select('account.email', 'email')
      .where('account.email LIKE :emailPrefix', { emailPrefix: 'client-%@example.com' })
      .getRawMany<{ email: string }>();
    const existingEmails = new Set(existingAccounts.map(account => account.email));
    const people: Person[] = [];
    const generatedClients: GeneratedClient[] = [];

    for (let index = 1; index <= count; index += 1) {
      const generatedClient = createArabicClient(index);

      // this ensures no duplicate emails in generated clients
      if (existingEmails.has(generatedClient.email)) {
        continue;
      }

      const person = personRepository.create(generatedClient);
      people.push(person);
      generatedClients.push(generatedClient);
    }

    await personRepository.save(people, { chunk: batchSize });
    const clients = people.map(person => clientRepository.create({
      person: { id: person.id } as Person,
      total_paid_cash: 0,
      client_status: ClientStatus.Active,
    }));
    const accounts = people.map((person, index) => accountRepository.create({
      person: { id: person.id } as Person,
      email: generatedClients[index].email,
      password_hash: passwordHash,
      role: Role.Client,
    }));

    await clientRepository.save(clients, { chunk: batchSize });
    await accountRepository.save(accounts, { chunk: batchSize });

    await queryRunner.commitTransaction();
    console.log(`[seed-clients] Added ${people.length} of ${count} requested clients`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seedClients().catch(error => {
  console.error('[seed-clients] Seeding failed');
  console.error(error);
  process.exitCode = 1;
});
