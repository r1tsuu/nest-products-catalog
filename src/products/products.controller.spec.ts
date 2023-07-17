import { Test } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import {
  createMockProductById,
  createMockProductBySlug,
  mockProduct,
  mockProducts,
} from './__mocks__/products';

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
            findAll: jest.fn().mockResolvedValue(mockProducts),
            findOneById: jest.fn().mockImplementation(createMockProductById),
            findOneBySlug: jest
              .fn()
              .mockImplementation(createMockProductBySlug),
            create: jest.fn().mockImplementation((body: any) => ({
              ...body,
              id: 'uuid',
              slug: body.slug ?? 'slug',
            })),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get(ProductsController);
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('Should return array of products', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const products = await controller.findAll();
      expect(products).toEqual(mockProducts);
      expect(findAllSpy).toBeCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('Should return a product by id', async () => {
      const findOneByIdSpy = jest.spyOn(service, 'findOneById');
      const id = 'some-test-uuid';
      const product = await controller.findById(id);
      expect(product).toEqual({ ...mockProduct, id });
      expect(findOneByIdSpy).toBeCalledTimes(1);
      expect(findOneByIdSpy).toBeCalledWith(id);
    });
  });

  describe('findBySlug', () => {
    it('Should return a product by slug', async () => {
      const findOneBySlugSpy = jest.spyOn(service, 'findOneBySlug');
      const slug = 'iphone-3-blue';
      const product = await controller.findBySlug(slug);
      expect(product).toEqual({ ...mockProduct, slug });
      expect(findOneBySlugSpy).toBeCalledTimes(1);
      expect(findOneBySlugSpy).toBeCalledWith(slug);
    });
  });

  describe('create', () => {
    it('Should return a created product', async () => {
      const createSpy = jest.spyOn(service, 'create');
      const { id, slug, ...createData } = mockProduct;
      const product = await controller.create(createData);
      expect(product).toEqual({ ...createData, id: 'uuid', slug: 'slug' });
      expect(createSpy).toBeCalledTimes(1);
      expect(createSpy).toBeCalledWith(createData);
    });

    it('Should return a created product with specified slug', async () => {
      const createSpy = jest.spyOn(service, 'create');
      const { id, ...createData } = mockProduct;
      const product = await controller.create(createData);
      expect(product).toEqual({ ...createData, id: 'uuid' });
      expect(createSpy).toBeCalledTimes(1);
      expect(createSpy).toBeCalledWith(createData);
    });
  });

  describe('delete', () => {
    it('Should return true', async () => {
      const deleteSpy = jest.spyOn(service, 'delete');
      const isDeleted = await controller.delete('uuid');
      expect(isDeleted).toEqual(true);
      expect(deleteSpy).toBeCalledTimes(1);
      expect(deleteSpy).toBeCalledWith('uuid');
    });

    it('Should return false', async () => {
      const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue(false);
      const isDeleted = await controller.delete('uuid-2');
      expect(isDeleted).toEqual(false);
      expect(deleteSpy).toBeCalledTimes(1);
      expect(deleteSpy).toBeCalledWith('uuid-2');
    });
  });
});
