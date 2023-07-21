import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { Repository } from 'typeorm';
import { User } from '@/users/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
  ) {}

  async create(user: User): Promise<Cart> {
    const cart = await this.cartRepository.save({
      user,
    });
  }

  async getCartByUser(user: User) {}
}
