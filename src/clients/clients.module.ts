import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { Client } from './client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]), 
    PeopleModule
  ],
  controllers: [ClientsController],
  providers: [ClientsService]
})
export class ClientsModule {}
