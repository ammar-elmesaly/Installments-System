import { IsString, MaxLength } from "class-validator";

export class UpdateNotesDTO {
  @IsString()
  @MaxLength(1000)
  notes: string
}