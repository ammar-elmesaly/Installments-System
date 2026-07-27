import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { CreateClientDTO, UpdateClientDTO } from './dto/client.dto';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { Person } from '../people/person.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { QueryRunner } from 'typeorm';
import { ClientStatus } from './enums/clientStatus.enum';
import { Account } from '../accounts/account.entity';
import { Admin } from '../admins/admin.entity';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';
import { ActivityAction } from '../activity_logs/enums/activityAction.enum';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private dataSource: DataSource,
    private activityLogsService: ActivityLogsService,
  ) {}

  findAll(): Promise<Client[]> {
    return this.clientsRepository.find({ relations: { person: true } });
  }

  async findById(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id }, relations: { person: true } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  private async findAdminByAccountId(manager: EntityManager, accountId: string): Promise<Admin> {
    const account = await manager.findOne(Account, {
      where: { id: accountId },
      relations: { person: { admin: true } },
    });
    if (!account?.person?.admin) {
      throw new NotFoundException(`Admin associated with account ID ${accountId} not found`);
    }
    return account.person.admin;
  }

  async create(
    createClientDto: CreateClientDTO,
    accountId: string,
    queryRunner: QueryRunner = this.dataSource.createQueryRunner()
  ): Promise<Client> {
    const isLocalRunner = !queryRunner.isTransactionActive;

    if (isLocalRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      const admin = await this.findAdminByAccountId(queryRunner.manager, accountId);

      const duplicatePerson = await queryRunner.manager.findOne(Person, {
        where: [
          {
            first_name: createClientDto.first_name,
            second_name: createClientDto.second_name,
            third_name: createClientDto.third_name,
            last_name: createClientDto.last_name,
          },
          { phone_number: createClientDto.phone_number },
        ],
      });

      if (duplicatePerson) {
        if (duplicatePerson.phone_number === createClientDto.phone_number) {
          throw new ConflictException('This phone number is already registered.');
        }

        throw new ConflictException('A person with this exact full name already exists.');
      }

      const person = queryRunner.manager.create(Person, createClientDto);
      const savedPerson = await queryRunner.manager.save(person);

      const client = queryRunner.manager.create(Client, { person: savedPerson });
      const savedClient = await queryRunner.manager.save(client);

      await this.activityLogsService.log(
        {
          admin,
          action: ActivityAction.ClientCreated,
          target_id: savedClient.id,
          target_label: `${savedPerson.first_name} ${savedPerson.last_name}`.trim(),
          metadata: { phone_number: savedPerson.phone_number },
        },
        queryRunner.manager,
      );

      if (isLocalRunner) {
        await queryRunner.commitTransaction();
      }
      return savedClient;

    } catch (error) {
      if (isLocalRunner) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (isLocalRunner) {
        await queryRunner.release();
      }
    }
  }

  async updateById(
    id: string,
    updateClientDTO: UpdateClientDTO,
    accountId: string,
  ): Promise<Client> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const admin = await this.findAdminByAccountId(queryRunner.manager, accountId);

      const client = await queryRunner.manager.findOne(Client, {
        where: { id },
        relations: { person: true },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      const { total_paid_cash, client_status, ...personFields } = updateClientDTO;

      const hasNameChange =
        personFields.first_name !== undefined ||
        personFields.second_name !== undefined ||
        personFields.third_name !== undefined ||
        personFields.last_name !== undefined;
      const hasPhoneChange = personFields.phone_number !== undefined;

      if ((hasNameChange || hasPhoneChange) && client.person) {
        const mergedName = {
          first_name: personFields.first_name ?? client.person.first_name,
          second_name: personFields.second_name ?? client.person.second_name,
          third_name: personFields.third_name ?? client.person.third_name,
          last_name: personFields.last_name ?? client.person.last_name,
        };
        const mergedPhone = personFields.phone_number ?? client.person.phone_number;

        const duplicatePerson = await queryRunner.manager
          .createQueryBuilder(Person, 'person')
          .where('person.id != :selfId', { selfId: client.person.id })
          .andWhere(
            new Brackets((qb) => {
              qb.where(
                'person.first_name = :first_name AND person.second_name = :second_name AND person.third_name = :third_name AND person.last_name = :last_name',
                mergedName,
              ).orWhere('person.phone_number = :phone_number', { phone_number: mergedPhone });
            }),
          )
          .getOne();

        if (duplicatePerson) {
          if (duplicatePerson.phone_number === mergedPhone) {
            throw new ConflictException('This phone number is already registered.');
          }
          throw new ConflictException('A person with this exact full name already exists.');
        }
      }

      if (Object.keys(personFields).length > 0 && client.person) {
        queryRunner.manager.merge(Person, client.person, personFields);
        await queryRunner.manager.save(Person, client.person);
      }

      queryRunner.manager.merge(Client, client, { total_paid_cash, client_status });

      const savedClient = await queryRunner.manager.save(Client, client);

      await this.activityLogsService.log(
        {
          admin,
          action: ActivityAction.ClientUpdated,
          target_id: savedClient.id,
          target_label: `${client.person.first_name} ${client.person.last_name}`.trim(),
          metadata: updateClientDTO as Record<string, unknown>,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      return savedClient;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteById(
    id: string,
    accountId: string,
    manager: EntityManager = this.clientsRepository.manager
  ): Promise<Person> {
    const admin = await this.findAdminByAccountId(manager, accountId);

    const client = await manager.getRepository(Client).findOne({
      where: { id },
      relations: { person: true }
    })

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    const removedPerson = await manager.getRepository(Person).remove(client.person);

    await this.activityLogsService.log(
      {
        admin,
        action: ActivityAction.ClientDeleted,
        target_id: id,
        target_label: `${client.person.first_name} ${client.person.last_name}`.trim(),
      },
      manager,
    );

    return removedPerson;
  }

  paginate(
    options: IPaginationOptions,
    status?: ClientStatus,
    search?: string,
  ): Promise<Pagination<Client>> {
    const query = this.clientsRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.person', 'person');

    if (status) {
      query.andWhere('client.client_status = :status', { status })
    }

    if (search) {
      const term = `%${search}%`;

      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            `CONCAT(person.first_name, ' ', person.second_name, ' ', person.third_name, ' ', person.last_name) ILIKE :term`,
            { term },
          )
            .orWhere('person.nick_name ILIKE :term', { term })
            .orWhere('person.phone_number ILIKE :term', { term })
            .orWhere('person.address ILIKE :term', { term })
            .orWhere('person.profession ILIKE :term', { term })
        }),
      )
    }

    return paginate<Client>(query, options);
  }
}