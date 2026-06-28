import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './people.entity';
import { CreatePersonDTO, UpdatePersonDTO } from './dto/person.dto';
import { UpdateResult } from 'typeorm/browser';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person)
    private peopleRepository: Repository<Person>,
  ) {}

  findAll(): Promise<Person[]> {
    return this.peopleRepository.find();
  }

  findById(id: string): Promise<Person> {
    return this.peopleRepository.findOneBy({ id });
  }

  create(createPersonDTO: CreatePersonDTO): Promise<Person> {
    const person = this.peopleRepository.create(createPersonDTO);
    return this.peopleRepository.save(person);
  }

  deleteById(id: string) {
    return this.peopleRepository.delete(id);
  }

  async updateById(id: string, updatePersonDTO: UpdatePersonDTO): Promise<Person> {
    const person = await this.peopleRepository.preload({
      id,
      ...updatePersonDTO,
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return this.peopleRepository.save(person);
  }
  }