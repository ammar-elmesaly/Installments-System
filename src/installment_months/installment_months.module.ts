import { Module } from '@nestjs/common';
import { InstallmentMonthsController } from './installment_months.controller';
import { InstallmentMonthsService } from './installment_months.service';

@Module({
  controllers: [InstallmentMonthsController],
  providers: [InstallmentMonthsService]
})
export class InstallmentMonthsModule {}
