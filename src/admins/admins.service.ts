import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { CreateAdminDTO, UpdateAdminDTO } from './dto/admin.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PeopleService } from '../people/people.service';
import { Person } from '../people/person.entity';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
    private peopleService: PeopleService, 
    private dataSource: DataSource,
  ) {}

  findAll(): Promise<Admin[]> {
    return this.adminsRepository.find({ relations: { person: true } });
  }

  findById(id: string): Promise<Admin> {
    const admin = this.adminsRepository.findOne({ where: { id }, relations: { person: true } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async create(createAdminDTO: CreateAdminDTO): Promise<Admin> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.peopleService.validateUniqueIdentifiers(
        createAdminDTO.first_name,
        createAdminDTO.second_name,
        createAdminDTO.third_name,
        createAdminDTO.last_name,
        createAdminDTO.phone_number,
        queryRunner.manager
      );

      const person = await this.peopleService.create(createAdminDTO, queryRunner.manager); 

      const admin = queryRunner.manager.create(Admin, { person });
      const savedAdmin = await queryRunner.manager.save(admin);

      await queryRunner.commitTransaction();
      return savedAdmin;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
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
      const adminRepo = queryRunner.manager.getRepository(Admin);
      const personRepo = queryRunner.manager.getRepository(Person);

      const admin = await adminRepo.findOne({
        where: { id },
        relations: { person: true },
      });

      if (!admin) {
        throw new NotFoundException(`Admin with ID ${id} not found`);
      }

      const { admin_level, ...personFields } = updateAdminDTO;

      if (Object.keys(personFields).length > 0 && admin.person) {
        personRepo.merge(admin.person, personFields);
        await personRepo.save(admin.person);
      }

      adminRepo.merge(admin, { admin_level });

      const savedAdmin = await adminRepo.save(admin);
      await queryRunner.commitTransaction();

      return savedAdmin;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      queryRunner.release();
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