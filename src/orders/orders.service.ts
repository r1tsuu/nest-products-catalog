import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/users/user.entity';
import { ProductsService } from '@/products/products.service';
import { isAdmin } from '@/shared/is-admin';

import { CreateOrderDTO } from './dto/create-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  async create({ productIds }: CreateOrderDTO, user: User) {
    const products = await this.productsService.findByIds(productIds);
    if (!products.length)
      throw new BadRequestException(
        'Products with provided ids have not been found',
      );

    const order = this.ordersRepo.create({ user, products });
    return this.ordersRepo.save(order);
  }

  async findAll() {
    return this.ordersRepo.find({
      relations: {
        user: true,
        products: true,
      },
    });
  }

  async findAllByUser(user: User) {
    return this.ordersRepo.find({
      where: {
        user: {
          id: user.id,
        },
      },
      relations: {
        user: true,
        products: true,
      },
    });
  }

  async findById(id: string) {
    return this.ordersRepo.findOne({
      where: { id },
      relations: {
        user: true,
        products: true,
      },
    });
  }

  async findByIdOrFail(id: string) {
    const order = await this.findById(id);
    if (!order)
      throw new BadRequestException(
        'Order with provided id has not been found',
      );
    return order;
  }

  async cancel(id: string, user?: User) {
    const order = await this.findByIdOrFail(id);

    if (user && !isAdmin(user) && order.user.id !== user.id)
      throw new ForbiddenException();

    if (order.isCanceled)
      throw new BadRequestException('Order is already canceled');

    await this.ordersRepo.update({ id }, { isCanceled: true });
    return this.findById(id);
  }

  async process(id: string) {
    const order = await this.findByIdOrFail(id);

    if (order.isProcessed)
      throw new BadRequestException('Order is already processed');

    if (order.isCanceled) throw new BadRequestException('Order is canceled');

    await this.ordersRepo.update({ id }, { isProcessed: true });
    return this.findById(id);
  }

  async delete(id: string) {
    try {
      await this.ordersRepo.delete({ id });
      return true;
    } catch (error) {
      return false;
    }
  }
}
