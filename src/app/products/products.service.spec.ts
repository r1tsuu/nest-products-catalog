import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { SlugGeneratorService } from '../shared/slug-generator.service';
import { Repository } from 'typeorm';

import {
  mockProducts,
  mockProduct,
  createMockProductById,
  createMockProductBySlug,
  createMockProductsByTitle,
} from './__mocks__/products';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest
              .fn()
              .mockImplementation((obj: any) => ({ ...obj, id: 'uuid' })),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: SlugGeneratorService,
          useValue: {
            generate: jest.fn().mockReturnValue('generated-slug'),
            updateSlugByTitle: jest.fn().mockReturnValue('updated-slug'),
          },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    repo = module.get(getRepositoryToken(Product));
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('Should return all products', async () => {
      const findSpy = jest
        .spyOn(repo, 'find')
        .mockResolvedValueOnce(mockProducts);
      const products = await service.findAll();
      expect(products).toEqual(mockProducts);
      expect(findSpy).toBeCalledTimes(1);
    });
  });

  describe('findOneById', () => {
    it('Should return a product by id', async () => {
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockImplementationOnce(({ where: { id } }: any) =>
          Promise.resolve(createMockProductById(id)),
        );

      const id = 'product-uuid';
      const product = await service.findOneById(id);
      expect(product).toEqual(createMockProductById(id));
      expect(findOneSpy).toBeCalledTimes(1);
      expect(findOneSpy).toBeCalledWith({ where: { id } });
    });
  });

  describe('findOneBySlug', () => {
    it('Should return a product by slug', async () => {
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockImplementationOnce(({ where: { slug } }: any) =>
          Promise.resolve(createMockProductBySlug(slug)),
        );

      const slug = 'product-slug';
      const product = await service.findOneBySlug(slug);
      expect(product).toEqual(createMockProductBySlug(slug));
      expect(findOneSpy).toBeCalledTimes(1);
      expect(findOneSpy).toBeCalledWith({ where: { slug } });
    });
  });

  describe('findByTitle', () => {
    it('Should return products by title', async () => {
      const findSpy = jest
        .spyOn(repo, 'find')
        .mockImplementationOnce(({ where: { title } }: any) =>
          Promise.resolve(createMockProductsByTitle(title)),
        );

      const title = 'product-title';
      const products = await service.findByTitle(title);
      expect(products).toEqual(createMockProductsByTitle(title));
      expect(findSpy).toBeCalledTimes(1);
      expect(findSpy).toBeCalledWith({ where: { title } });
    });
  });

  describe('create', () => {
    it('Should create a product', async () => {
      const { id, slug, ...product } = mockProduct;
      const saveSpy = jest.spyOn(repo, 'save');
      const createdProduct = await service.create(product);

      expect(createdProduct).toEqual({
        id: expect.any(String),
        slug: 'generated-slug',
        ...product,
      });

      expect(saveSpy).toBeCalledTimes(1);
      expect(saveSpy).toBeCalledWith({
        id: expect.any(String),
        slug: 'generated-slug',
        ...product,
      });
    });

    it('Should create a product with specified slug', async () => {
      const { id, ...product } = mockProduct;
      const saveSpy = jest.spyOn(repo, 'save');
      const createdProduct = await service.create(product);

      expect(createdProduct).toEqual({
        id: expect.any(String),
        ...product,
      });

      expect(saveSpy).toBeCalledTimes(1);
      expect(saveSpy).toBeCalledWith({
        id: expect.any(String),
        ...product,
      });
    });
  });

  describe('update', () => {
    it('Should return an updated product', async () => {
      const id = 'uuid';

      const dataToUpdate = {
        slug: 'new title',
        price: 1200,
      };

      const updateSpy = jest.spyOn(repo, 'update');

      const findOneByIdSpy = jest
        .spyOn(service, 'findOneById')
        .mockImplementationOnce((id) =>
          Promise.resolve(createMockProductById(id)),
        );

      findOneByIdSpy.mockImplementationOnce((id) =>
        Promise.resolve({
          ...createMockProductById(id),
          ...dataToUpdate,
        }),
      );

      const updatedProduct = await service.update(id, dataToUpdate);

      expect(updatedProduct).toEqual({
        ...createMockProductById(id),
        ...dataToUpdate,
      });

      expect(findOneByIdSpy).toBeCalledTimes(2);
      expect(updateSpy).toBeCalledTimes(1);
      expect(updateSpy).toBeCalledWith(
        { id },
        { ...dataToUpdate, slug: 'updated-slug' },
      );
    });

    it('Should throw an error because product has been not found', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(null);

      await expect(() =>
        service.update('not-found-uuid', { photo: 'photo-url-new' }),
      ).rejects.toThrow('Product with that id has not been found');
    });
  });

  describe('delete', () => {
    const id = 'uuid';
    it('Should return true that product has been deleted', async () => {
      const deleteSpy = jest.spyOn(repo, 'delete');
      const isDeleted = await service.delete(id);
      expect(isDeleted).toEqual(true);
      expect(deleteSpy).toBeCalledTimes(1);
      expect(deleteSpy).toBeCalledWith({ id });
    });

    it('Should return false that product has not been deleted', async () => {
      const deleteSpy = jest
        .spyOn(repo, 'delete')
        .mockRejectedValue(new Error());
      const isDeleted = await service.delete(id);
      expect(isDeleted).toEqual(false);
      expect(deleteSpy).toBeCalledTimes(1);
      expect(deleteSpy).toBeCalledWith({ id });
    });
  });
});
