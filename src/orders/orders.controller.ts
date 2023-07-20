import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { HasRoles } from '@/auth/decorators/has-roles.decorator';
import { RequestUser } from '@/auth/decorators/request-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Role } from '@/users/interfaces/role.enum';
import { User } from '@/users/user.entity';
import { DeleteTransformInterceptor } from '@/shared/interceptors/delete-transform.interceptor';

import { OrdersService } from './orders.service';
import { CreateOrderDTO } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @HasRoles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get('/user')
  @ApiBearerAuth()
  @HasRoles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAllByUser(@RequestUser() user: User) {
    return this.ordersService.findAllByUser(user);
  }

  @Post()
  @ApiBearerAuth()
  @HasRoles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createData: CreateOrderDTO, @RequestUser() user: User) {
    return this.ordersService.create(createData, user);
  }

  @Put('/cancel/:id')
  @ApiBearerAuth()
  @HasRoles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async cancel(@Param('id') id: string, @RequestUser() user: User) {
    return this.ordersService.cancel(id, user);
  }

  @Put('/process/:id')
  @ApiBearerAuth()
  @HasRoles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async process(@Param('id') id: string) {
    return this.ordersService.process(id);
  }

  @Delete('/:id')
  @ApiBearerAuth()
  @HasRoles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(DeleteTransformInterceptor)
  async delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}
