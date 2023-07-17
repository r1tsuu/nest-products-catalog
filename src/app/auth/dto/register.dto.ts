import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDTO {
  @ApiProperty({ minimum: 6, maximum: 26 })
  @IsString()
  @IsNotEmpty()
  @Length(6, 26)
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(6, 20)
  password: string;
}
