import { Test } from '@nestjs/testing';
import { randUuid } from '@ngneat/falso';

import { randProduct, randProducts } from '@/__test_utils__/products';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findOneById: jest.fn(),
            findOneBySlug: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ProductsController);
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('Should return array of products', async () => {
      const productsData = randProducts(6);
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(productsData);

      const products = await controller.findAll();

      expect(products).toEqual(productsData);
      expect(findAllSpy).toBeCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('Should return a product by id', async () => {
      const productData = randProduct();
      const findOneByIdSpy = jest
        .spyOn(service, 'findOneById')
        .mockResolvedValue(productData);
      const { id } = productData;

      const product = await controller.findById(id);

      expect(product).toEqual(productData);
      expect(findOneByIdSpy).toBeCalledWith(id);
    });
  });

  describe('findBySlug', () => {
    it('Should return a product by slug', async () => {
      const productData = randProduct();
      const { slug } = productData;
      const findOneBySlugSpy = jest
        .spyOn(service, 'findOneBySlug')
        .mockResolvedValue(productData);

      const product = await controller.findBySlug(slug);

      expect(product).toEqual(productData);
      expect(findOneBySlugSpy).toBeCalledWith(slug);
    });
  });

  describe('create', () => {
    it('Should return a created product', async () => {
      const productData = randProduct();
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(productData);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, slug, ...createData } = productData;

      const product = await controller.create(createData);

      expect(product).toEqual(productData);
      expect(createSpy).toBeCalledWith(createData);
    });

    it('Should return a created product with specified slug', async () => {
      const productData = randProduct();
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(productData);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...createData } = productData;

      const product = await controller.create(createData);

      expect(product).toEqual(productData);
      expect(createSpy).toBeCalledWith(createData);
    });
  });

  describe('delete', () => {
    it('Should return true', async () => {
      const id = randUuid();
      const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue(true);

      const isDeleted = await controller.delete(id);

      expect(isDeleted).toEqual(true);
      expect(deleteSpy).toBeCalledWith(id);
    });

    it('Should return false', async () => {
      const id = randUuid();
      const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue(false);

      const isDeleted = await controller.delete(id);

      expect(isDeleted).toEqual(false);
      expect(deleteSpy).toBeCalledWith(id);
    });
  });
});
