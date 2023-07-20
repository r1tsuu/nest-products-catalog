import { Module } from '@nestjs/common';
import { CartService } from './cart/cart.service';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  providers: [CartService],
  controllers: [CartController]
})
export class CartModule {}
