import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
  ValidateNested,
} from 'class-validator';
import { Role } from '../enums/roles.enum';
import { Exclude } from 'class-transformer';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @Length(6, 26)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsArray()
  @ValidateNested()
  @IsEnum(Role)
  roles?: Role[];
}
