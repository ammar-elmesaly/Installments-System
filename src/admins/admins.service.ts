import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { CreateAdminDTO, UpdateAdminDTO } from './dto/admin.dto';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { Person } from '../people/person.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
    private dataSource: DataSource,
  ) {}

  findAll(): Promise<Admin[]> {
    return this.adminsRepository.find({ relations: { person: true } });
  }

  async findById(id: string): Promise<Admin> {
    const admin = await this.adminsRepository.findOne({ where: { id }, relations: { person: true } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async create(
    createAdminDTO: CreateAdminDTO,
    queryRunner: QueryRunner = this.dataSource.createQueryRunner()
  ): Promise<Admin> {
    const isLocalRunner = !queryRunner.isTransactionActive;

    if (isLocalRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }
    
    try {
      const duplicatePerson = await queryRunner.manager.findOne(Person, {
        where: [
          {
            first_name: createAdminDTO.first_name,
            second_name: createAdminDTO.second_name,
            third_name: createAdminDTO.third_name,
            last_name: createAdminDTO.last_name,
          },
          { phone_number: createAdminDTO.phone_number },
        ],
      });

      if (duplicatePerson) {
        if (duplicatePerson.phone_number === createAdminDTO.phone_number) {
          throw new ConflictException('This phone number is already registered.');
        }

        throw new ConflictException('A person with this exact full name already exists.');
      }

      const person = queryRunner.manager.create(Person, createAdminDTO);
      const savedPerson = await queryRunner.manager.save(person);

      const admin = queryRunner.manager.create(Admin, { person: savedPerson });
      const savedAdmin = await queryRunner.manager.save(admin);

      if (isLocalRunner) {
        await queryRunner.commitTransaction();
      }
      return savedAdmin;

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
    updateAdminDTO: UpdateAdminDTO,
  ): Promise<Admin> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const admin = await queryRunner.manager.findOne(Admin, {
        where: { id },
        relations: { person: true },
      });

      if (!admin) {
        throw new NotFoundException(`Admin with ID ${id} not found`);
      }

      const { admin_level, ...personFields } = updateAdminDTO;

      if (Object.keys(personFields).length > 0 && admin.person) {
        queryRunner.manager.merge(Person, admin.person, personFields);
        await queryRunner.manager.save(Person, admin.person);
      }

      queryRunner.manager.merge(Admin, admin, { admin_level });

      const savedAdmin = await queryRunner.manager.save(Admin, admin);
      await queryRunner.commitTransaction();

      return savedAdmin;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } 

  async deleteById(
    id: string, 
    manager: EntityManager = this.adminsRepository.manager
  ): Promise<Person> {
    const admin = await manager.getRepository(Admin).findOne({
      where: { id },
      relations: { person: true }
    })

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return manager.getRepository(Person).remove(admin.person);
  }

  paginate(options: IPaginationOptions): Promise<Pagination<Admin>> {
    return paginate<Admin>(this.adminsRepository, options, { relations: { person: true } });
  }
}