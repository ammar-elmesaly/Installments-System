import { Module } from '@nestjs/common';
import { InstallmentPlansController } from './installment_plans.controller';
import { InstallmentPlansService } from './installment_plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { ClientsModule } from '../clients/clients.module';
import { InstallmentMonthsModule } from '../installment_months/installment_months.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstallmentPlan]),
    ClientsModule,
    InstallmentMonthsModule
  ],
  controllers: [InstallmentPlansController],
  providers: [InstallmentPlansService]
})
export class InstallmentPlansModule {}
