import { IsOptional, IsString, Length, MaxLength } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";

export class CreatePersonDTO {
  @IsString()
  @MaxLength(100)
  readonly first_name: string;

  @IsString()
  @MaxLength(100)
  readonly second_name: string;

  @IsString()
  @MaxLength(100)
  readonly third_name: string;

  @IsString()
  @MaxLength(100)
  readonly last_name: string;

  @IsString()
  @Length(11, 11, { message: "phone_number must be exactly 11 characters long" })
  readonly phone_number: string;

  @IsString()
  @IsOptional()
  readonly profession: string;

  @IsString()
  @IsOptional()
  readonly address: string;

  @IsString()
  @IsOptional()
  readonly image_path?: string;
}

export class UpdatePersonDTO extends PartialType(CreatePersonDTO) {}