import { CreatePersonDTO } from "../../people/dto/person.dto";
import { IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { ClientStatus } from "../enums/clientStatus.enum";
import { PartialType } from "@nestjs/mapped-types";

export class CreateClientDTO extends CreatePersonDTO {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly total_paid_cash: number;

  @IsOptional()
  @IsEnum(ClientStatus)
  readonly client_status: ClientStatus;
}

export class UpdateClientDTO extends PartialType(CreateClientDTO) {}