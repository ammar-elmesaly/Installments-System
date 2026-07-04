import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Person } from './person.entity';
import { CreatePersonDTO, UpdatePersonDTO } from './dto/person.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person)
    private peopleRepository: Repository<Person>,
  ) {}

  findAll(): Promise<Person[]> {
    return this.peopleRepository.find();
  }
  
  async findById(id: string): Promise<Person> {
    const person = await this.peopleRepository.findOneBy({ id });
    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    return person;
  }

  async create(
    createPersonDTO: CreatePersonDTO, 
    manager: EntityManager = this.peopleRepository.manager
  ): Promise<Person> {
    const person = manager.create(Person, createPersonDTO);
    return manager.save(person);
  }

  async deleteById(
    id: string, 
    manager: EntityManager = this.peopleRepository.manager
  ): Promise<Person> {
    const person = await manager.findOneBy(Person, { id });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return manager.remove(person);
  }

  async updateById(
    id: string, 
    updatePersonDTO: UpdatePersonDTO, 
    manager: EntityManager = this.peopleRepository.manager
  ): Promise<Person> {
    const repo = manager.getRepository(Person);
    
    const person = await repo.preload({
      id,
      ...updatePersonDTO,
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return manager.save(person);
  }

  async validateUniqueIdentifiers(
    firstName: string,
    secondName: string,
    thirdName: string,
    lastName: string,
    phoneNumber: string,
    manager: EntityManager = this.peopleRepository.manager
  ): Promise<void> {
    const repo = manager.getRepository(Person);

    const existingPerson = await repo.findOne({
      where: [
        {
          first_name: firstName,
          second_name: secondName,
          third_name: thirdName,
          last_name: lastName,
        },
        { phone_number: phoneNumber }
      ],
    });

    // If a record is found, explicitly throw the correct HTTP exception
    if (existingPerson) {
      if (existingPerson.phone_number === phoneNumber) {
        throw new ConflictException('This phone number is already registered.');
      }

      throw new ConflictException('A person with this exact full name already exists.');
    }
  } 
}