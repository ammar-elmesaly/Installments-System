import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { CreateClientDTO, UpdateClientDTO } from './dto/client.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Person } from '../people/person.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { QueryRunner } from 'typeorm';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private dataSource: DataSource,
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

  async create(
    createClientDto: CreateClientDTO,
    queryRunner: QueryRunner = this.dataSource.createQueryRunner()
  ): Promise<Client> {
    const isLocalRunner = !queryRunner.isTransactionActive;

    if (isLocalRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
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
  ): Promise<Client> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = await queryRunner.manager.findOne(Client, {
        where: { id },
        relations: { person: true },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      const { total_paid_cash, client_status, ...personFields } = updateClientDTO;

      if (Object.keys(personFields).length > 0 && client.person) {
        queryRunner.manager.merge(Person, client.person, personFields);
        await queryRunner.manager.save(Person, client.person);
      }

      queryRunner.manager.merge(Client, client, { total_paid_cash, client_status });

      const savedClient = await queryRunner.manager.save(Client, client);
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
    manager: EntityManager = this.clientsRepository.manager
  ): Promise<Person> {
    const client = await manager.getRepository(Client).findOne({
      where: { id },
      relations: { person: true }
    })

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return manager.getRepository(Person).remove(client.person);
  }

  paginate(options: IPaginationOptions): Promise<Pagination<Client>> {
    return paginate<Client>(this.clientsRepository, options, { relations: { person: true } });
  }
}