import { Module } from '@nestjs/common';
import { InstallmentPlansController } from './installment_plans.controller';
import { InstallmentPlansService } from './installment_plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([InstallmentPlan]),
    ActivityLogsModule
  ],
  controllers: [InstallmentPlansController],
  providers: [InstallmentPlansService]
})
export class InstallmentPlansModule {}
