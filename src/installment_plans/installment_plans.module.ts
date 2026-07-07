import { Module } from '@nestjs/common';
import { InstallmentPlansController } from './installment_plans.controller';
import { InstallmentPlansService } from './installment_plans.service';

@Module({
  controllers: [InstallmentPlansController],
  providers: [InstallmentPlansService]
})
export class InstallmentPlansModule {}
