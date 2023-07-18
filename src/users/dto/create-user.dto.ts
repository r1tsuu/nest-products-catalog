import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { Role } from '@/models/role.enum';

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
