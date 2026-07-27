import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    ActivityLogsModule
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService]
})
export class ClientsModule {}
