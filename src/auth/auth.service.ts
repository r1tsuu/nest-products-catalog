import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '@/users/users.service';
import { User } from '@/models/user.entity';

import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async register(registrationData: RegisterDTO) {
    const foundEmail = await this.usersService.findOneByEmail(
      registrationData.email,
    );

    if (foundEmail)
      throw new HttpException(
        'User with that email already exists',
        HttpStatus.BAD_REQUEST,
      );

    const foundUsername = await this.usersService.findOneByUsername(
      registrationData.username,
    );

    if (foundUsername)
      throw new HttpException(
        'User with that username already exists',
        HttpStatus.BAD_REQUEST,
      );

    const hashedPassword = await this.hashPassword(registrationData.password);

    const createdUser = await this.usersService.create({
      ...registrationData,
      password: hashedPassword,
    });

    return createdUser;
  }

  async verifyPassword(password: string, hashedPassword: string) {
    try {
      const matches = await bcrypt.compare(password, hashedPassword);
      return matches;
    } catch (error) {
      return false;
    }
  }

  async getAuthenticatedUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user)
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );

    const isPasswordMatching = await this.verifyPassword(
      password,
      user.password,
    );
    if (!isPasswordMatching)
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );

    return user;
  }

  async signToken(user: User) {
    return this.jwtService.sign({ userId: user.id, roles: user.roles });
  }

  async login(loginData: LoginDTO) {
    const user = await this.getAuthenticatedUser(
      loginData.email,
      loginData.password,
    );
    return this.signToken(user);
  }
}
