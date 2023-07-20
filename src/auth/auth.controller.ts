import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerData: RegisterDTO) {
    return this.authService.register(registerData);
  }

  @HttpCode(200)
  @Post('sign-in')
  async login(@Body() loginData: LoginDTO) {
    return this.authService.login(loginData);
  }
}
