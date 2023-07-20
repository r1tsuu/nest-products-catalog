import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersFindOneOptions } from './interfaces/users-find-one-options.interface';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepo.find();
  }

  async findOne(options?: UsersFindOneOptions) {
    return this.userRepo.findOne({
      where: options,
      relations: {
        orders: true,
      },
    });
  }

  async findOneByUsername(username: string) {
    return this.findOne({ username });
  }
  async findOneByEmail(email: string) {
    return this.findOne({ email });
  }

  async findOneById(id: string) {
    return this.findOne({ id });
  }

  async create(userData: CreateUserDTO) {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }
}
