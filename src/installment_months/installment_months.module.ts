import { Module } from '@nestjs/common';
import { InstallmentMonthsController } from './installment_months.controller';
import { InstallmentMonthsService } from './installment_months.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallmentMonth } from './installment_month.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstallmentMonth])
  ],
  controllers: [InstallmentMonthsController],
  providers: [InstallmentMonthsService],
  exports: [InstallmentMonthsService]
})
export class InstallmentMonthsModule {}
