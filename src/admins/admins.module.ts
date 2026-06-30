import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { PeopleModule } from '../people/people.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    PeopleModule
  ],
  controllers: [AdminsController],
  providers: [AdminsService]
})
export class AdminsModule {}
