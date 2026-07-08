import { IsString, IsUUID, Length, MaxLength } from "class-validator";

export class CreateFallbackContactDTO {
  @IsUUID()
  client_id: string;
  
  @IsString()
  @MaxLength(100)
  readonly name: string;

  @IsString()
  @MaxLength(100)
  readonly relationship: string;

  @IsString()
  @Length(11, 11, { message: "phone_number must be exactly 11 characters long" })
  readonly phone_number: string;

  @IsString()
  readonly notes?: string;
}