import { Module } from '@nestjs/common';
import { FallbackContactsController } from './fallback_contacts.controller';
import { FallbackContactsService } from './fallback_contacts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FallbackContact } from './fallback_contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FallbackContact])],
  controllers: [FallbackContactsController],
  providers: [FallbackContactsService]
})
export class FallbackContactsModule {}
