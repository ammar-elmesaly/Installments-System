import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { AdminsModule } from '../admins/admins.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    AdminsModule,
    ClientsModule
  ],
  controllers: [AccountsController],
  providers: [AccountsService]
})
export class AccountsModule {}
