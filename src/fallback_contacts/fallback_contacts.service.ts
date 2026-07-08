import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FallbackContact } from './fallback_contact.entity';
import { QueryRunner, Repository, DataSource } from 'typeorm';
import { CreateFallbackContactDTO } from './dto/createFallbackContact.dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class FallbackContactsService {
  constructor(
    @InjectRepository(FallbackContact)
    private fallbackContactsRepository: Repository<FallbackContact>,
    private clientsService: ClientsService,
    private dataSource: DataSource
  ) {}

  async create(
    createFallbackContactDTO: CreateFallbackContactDTO,
    queryRunner: QueryRunner = this.dataSource.createQueryRunner()
  ) {
    const isLocalRunner = !queryRunner.isTransactionActive;
    
    if (isLocalRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }
    
    try {
      const { client_id, name, relationship, phone_number, notes } = createFallbackContactDTO;
      
      const duplicateAccount = await queryRunner.manager.findOne(FallbackContact, {
        where: { phone_number }
      });

      if (duplicateAccount) {
        throw new ConflictException('A fallback contact with this phone number already exists.');
      }
      
      const client = await this.clientsService.findById(client_id);

      const fallbackContact = queryRunner.manager.create(FallbackContact, {
        name,
        phone_number,
        relationship,
        clients: [client],
        notes
      });

      const savedFallbackContact = await queryRunner.manager.save(fallbackContact);

      if (isLocalRunner) {
        await queryRunner.commitTransaction();
      }

      return savedFallbackContact;

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
}
