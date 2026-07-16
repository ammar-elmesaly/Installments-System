import { IsUUID, IsNumber, IsInt, IsArray, ValidateNested, Min, IsOptional, IsDateString, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemDTO)
  items: PlanItemDTO[];
}