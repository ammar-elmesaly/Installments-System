import { Module } from '@nestjs/common';
import { FallbackContactsController } from './fallback_contacts.controller';
import { FallbackContactsService } from './fallback_contacts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FallbackContact } from './fallback_contact.entity';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FallbackContact]),
    ClientsModule
  ],
  controllers: [FallbackContactsController],
  providers: [FallbackContactsService]
})
export class FallbackContactsModule {}
