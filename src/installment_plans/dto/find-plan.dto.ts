import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { InstallmentPlanStatus } from "../enums/installmentPlanStatus.enum";

export class FindPlansDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsEnum(InstallmentPlanStatus)
  status?: InstallmentPlanStatus;

  @IsOptional()
  @IsString()
  search?: string;
}