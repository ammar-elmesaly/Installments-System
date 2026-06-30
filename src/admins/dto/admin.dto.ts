import { CreatePersonDTO } from "../../people/dto/person.dto";
import { IsEnum, IsOptional } from "class-validator";
import { AdminLevel } from "../enums/adminLevel.enum";
import { PartialType } from "@nestjs/mapped-types";

export class CreateAdminDTO extends CreatePersonDTO {
  @IsOptional()
  @IsEnum(AdminLevel)
  readonly admin_level: AdminLevel;
}

export class UpdateAdminDTO extends PartialType(CreateAdminDTO) {}