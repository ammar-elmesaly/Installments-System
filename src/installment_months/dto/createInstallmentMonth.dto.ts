import { IsUUID, IsDateString, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { InstallmentMonthStatus } from '../enums/installmentMonthStatus.enum';

export class CreateInstallmentMonthDTO {
  @IsUUID()
  installment_plan_id: string;

  @IsDateString()
  due_date: string | Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  expected_amount: number;

  @IsEnum(InstallmentMonthStatus)
  @IsOptional()
  status?: InstallmentMonthStatus;
}