import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Person } from './people/person.entity';
import { ClientsModule } from './clients/clients.module';
import { Client } from './clients/client.entity';
import { AdminsModule } from './admins/admins.module';
import { Admin } from './admins/admin.entity';
import { AccountsModule } from './accounts/accounts.module';
import { Account } from './accounts/account.entity';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './auth/jwt.guard';
import { InstallmentPlansModule } from './installment_plans/installment_plans.module';
import { InstallmentMonthsModule } from './installment_months/installment_months.module';
import { InstallmentPlan } from './installment_plans/installment_plan.entity';
import { InstallmentMonth } from './installment_months/installment_month.entity';
import { FallbackContactsModule } from './fallback_contacts/fallback_contacts.module';
import { FallbackContact } from './fallback_contacts/fallback_contact.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { Transaction } from './transactions/transaction.entity';
import { TelegramService } from './utils/telegram.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminLevelGuard } from './auth/admin-level.guard';
import { ActivityLogsModule } from './activity_logs/activity_logs.module';
import { ActivityLog } from './activity_logs/activity_logs.entity';
import { validate } from '../env.validation';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DB_URL
          ? process.env.DB_URL
          : `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        synchronize: process.env.NODE_ENV !== 'production',
        entities: [
          Person,
          Client,
          Admin,
          Account,
          InstallmentPlan,
          InstallmentMonth,
          FallbackContact,
          Transaction,
          ActivityLog,
        ],
      }),
    }),
    ClientsModule,
    AdminsModule,
    AccountsModule,
    AuthModule,
    InstallmentPlansModule,
    InstallmentMonthsModule,
    FallbackContactsModule,
    TransactionsModule,
    DashboardModule,
    ActivityLogsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TelegramService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminLevelGuard,
    },
  ],
})
export class AppModule {}

/*
* Use this to connect with standard username, password, & host.
TypeOrmModule.forRoot({
  type: "postgres",
  host: String(process.env.DB_HOST || 'localhost'),
  port: Number(process.env.DB_PORT) || 5432,
  username: String(process.env.DB_USERNAME),
  password: String(process.env.DB_PASSWORD),
  database: String(process.env.DB_NAME),
  synchronize: process.env.NODE_ENV !== 'production',
  entities: [
    Person,
    Client,
    Admin,
    Account,
    InstallmentPlan,
    InstallmentMonth,
    FallbackContact,
    Transaction
  ]
}),
*/