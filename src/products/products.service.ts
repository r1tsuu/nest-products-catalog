import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product } from '@/models/product.entity';
import { SlugGeneratorService } from '@/shared/slug-generator.service';

import { CreateProductDTO } from './dto/create-product.dto';
import { UpdateProductDTO } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly slugGenerator: SlugGeneratorService,
  ) {}

  async findAll() {
    return this.productsRepo.find();
  }

  async findByIds(ids: string[]) {
    return this.productsRepo.findBy({ id: In(ids) });
  }

  async findOneById(id: string) {
    return this.productsRepo.findOne({ where: { id } });
  }

  async findOneBySlug(slug: string) {
    return this.productsRepo.findOne({ where: { slug } });
  }

  async findByTitle(title: string) {
    return this.productsRepo.find({ where: { title } });
  }

  async create(productData: CreateProductDTO) {
    const product = this.productsRepo.create({
      ...productData,
      slug: productData.slug ?? this.slugGenerator.generate(productData.title),
    });
    return this.productsRepo.save(product);
  }

  async update(id: string, dataToUpdate: UpdateProductDTO) {
    const product = await this.findOneById(id);
    if (!product)
      throw new BadRequestException('Product with that id has not been found');
    const slug = this.slugGenerator.updateSlugByTitle(dataToUpdate, product);
    await this.productsRepo.update({ id }, { ...dataToUpdate, slug });
    return this.findOneById(id);
  }

  async delete(id: string) {
    try {
      await this.productsRepo.delete({ id });
      return true;
    } catch (error) {
      return false;
    }
  }
}
