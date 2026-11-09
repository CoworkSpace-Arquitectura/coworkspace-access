import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ValidateAccessDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsUUID()
  locationId!: string;
}