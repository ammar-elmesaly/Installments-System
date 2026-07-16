import { IsUUID, IsNumber, IsInt, IsArray, ValidateNested, Min, IsOptional, IsDateString, IsPositive, IsString, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../enums/paymentType.enum';

class PlanItemDTO {
  @IsUUID()
  inventor_item_id: string;

  
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateInstallmentPlanDTO {
  @IsUUID()
  client_id: string;

  @IsNumber()
  @IsPositive()
  @Min(0)
  down_payment: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  total_amount: number;

  @IsDateString()
  @IsOptional()
  start_date: Date | string;
  
  @IsInt()
  @Min(1)
  duration_months: number;

  @IsOptional()
  @IsEnum(PaymentType)
  payment_type: PaymentType;
  
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemDTO)
  items: PlanItemDTO[];
}