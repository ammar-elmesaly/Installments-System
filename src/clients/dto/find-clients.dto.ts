// dto/find-clients.dto.ts
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus } from '../enums/clientStatus.enum';

export class FindClientsDto {
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
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  search?: string;
}