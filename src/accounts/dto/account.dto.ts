import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, Matches } from "class-validator";
import { Role } from "../enums/role";
import { PartialType } from "@nestjs/mapped-types";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&#_\.\-]{8,}$/

export class CreateAccountDTO {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.' } )
  readonly password: string;

  @IsNotEmpty()
  @IsEnum(Role)
  readonly role: Role;
}

export class UpdateAccountDTO extends PartialType(CreateAccountDTO) {}