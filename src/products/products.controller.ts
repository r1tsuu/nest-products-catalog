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
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HasRoles } from '../auth/decorators/has-roles.decorator';
import { Role } from '../users/enums/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProductDTO } from './dto/create-product.dto';
import { UpdateProductDTO } from './dto/update-product.dto';
import { DeleteTransformInterceptor } from '../shared/interceptors/delete-transform.interceptor';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get('/id/:id')
  async findById(@Param('id') id: string) {
    return this.productsService.findOneById(id);
  }

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  @ApiBearerAuth()
  @HasRoles(Role.User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() productData: CreateProductDTO) {
    return this.productsService.create(productData);
  }

  @ApiBearerAuth()
  @HasRoles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() productUpdateData: UpdateProductDTO,
  ) {
    return this.productsService.update(id, productUpdateData);
  }

  @ApiBearerAuth()
  @HasRoles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(DeleteTransformInterceptor)
  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
