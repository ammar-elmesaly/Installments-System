import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { CreateClientDTO, UpdateClientDTO } from './dto/client.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PeopleService } from '../people/people.service';
import { Person } from '../people/person.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { QueryRunner } from 'typeorm';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private peopleService: PeopleService, 
    private dataSource: DataSource,
  ) {}

  findAll(): Promise<Client[]> {
    return this.clientsRepository.find({ relations: { person: true } });
  }

  findById(id: string): Promise<Client> {
    const client = this.clientsRepository.findOne({ where: { id }, relations: { person: true } });
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
      await this.peopleService.validateUniqueIdentifiers(
        createClientDto.first_name,
        createClientDto.second_name,
        createClientDto.third_name,
        createClientDto.last_name,
        createClientDto.phone_number,
        queryRunner.manager
      );

      const person = await this.peopleService.create(createClientDto, queryRunner.manager); 

      const client = queryRunner.manager.create(Client, { person });
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
      const clientRepo = queryRunner.manager.getRepository(Client);
      const personRepo = queryRunner.manager.getRepository(Person);

      const client = await clientRepo.findOne({
        where: { id },
        relations: { person: true },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      const { total_paid_cash, client_status, ...personFields } = updateClientDTO;

      if (Object.keys(personFields).length > 0 && client.person) {
        personRepo.merge(client.person, personFields);
        await personRepo.save(client.person);
      }

      clientRepo.merge(client, { total_paid_cash, client_status });

      const savedClient = await clientRepo.save(client);
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