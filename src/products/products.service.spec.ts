import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randNumber, randText, randUuid } from '@ngneat/falso';
import * as typeorm from 'typeorm';

import { SlugGeneratorService } from '@/shared/slug-generator.service';
import { randProduct, randProducts } from '@/__test_utils__/products';

import { Product } from './product.entity';
import { ProductsService } from './products.service';

jest.mock('typeorm', () => {
  const originalTypeORM = jest.requireActual('typeorm');
  return {
    ...originalTypeORM,
    In: jest.fn().mockImplementation((values: any) => values),
  };
});

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: Repository<Product>;
  let slugGeneratorService: SlugGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findBy: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn().mockImplementation((value: any) => value),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: SlugGeneratorService,
          useValue: {
            generate: jest.fn(),
            updateSlugByTitle: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    slugGeneratorService = module.get(SlugGeneratorService);
    repo = module.get(getRepositoryToken(Product));
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('Should return all products', async () => {
      const productsData = randProducts(5);
      const findSpy = jest.spyOn(repo, 'find').mockResolvedValue(productsData);

      const products = await service.findAll();

      expect(products).toEqual(productsData);
      expect(findSpy).toBeCalledTimes(1);
    });
  });

  describe('findByIds', () => {
    it('Should return all products with included ids', async () => {
      const productsToFind = randProducts(4);
      const ids = productsToFind.map((each) => each.id);
      const findBySpy = jest
        .spyOn(repo, 'findBy')
        .mockResolvedValueOnce(productsToFind);
      const inSpy = jest.spyOn(typeorm, 'In');

      const products = await service.findByIds(ids);

      expect(products).toEqual(productsToFind);
      expect(inSpy).toBeCalledWith(ids);
      expect(findBySpy).toBeCalledWith({ id: ids });
    });
  });

  describe('findOneById', () => {
    it('Should return a product by id', async () => {
      const id = randUuid();
      const productData = { ...randProduct(), id };
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockResolvedValue(productData);

      const product = await service.findOneById(id);

      expect(product).toEqual(productData);
      expect(findOneSpy).toBeCalledWith({ where: { id } });
    });
  });

  describe('findOneBySlug', () => {
    it('Should return a product by slug', async () => {
      const slug = randText();
      const productData = { ...randProduct(), slug };
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockResolvedValue(productData);

      const product = await service.findOneBySlug(slug);

      expect(product).toEqual(productData);
      expect(findOneSpy).toBeCalledWith({ where: { slug } });
    });
  });

  describe('findByTitle', () => {
    it('Should return products by title', async () => {
      const title = randText();
      const productsData = Array.from({ length: 5 }, () => ({
        ...randProduct(),
        title,
      }));
      const findSpy = jest.spyOn(repo, 'find').mockResolvedValue(productsData);

      const products = await service.findByTitle(title);

      expect(products).toEqual(productsData);
      expect(findSpy).toBeCalledWith({ where: { title } });
    });
  });

  describe('create', () => {
    it('Should create a product with generated slug', async () => {
      const productData = randProduct();
      const slugGenerated = randText();
      const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue(productData);
      const slugGeneratorSpy = jest
        .spyOn(slugGeneratorService, 'generate')
        .mockReturnValue(slugGenerated);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, slug, ...dataToCreate } = productData;

      const createdProduct = await service.create(dataToCreate);

      expect(createdProduct).toEqual(productData);
      expect(slugGeneratorSpy).toBeCalledWith(productData.title);
      expect(saveSpy).toBeCalledWith({ ...dataToCreate, slug: slugGenerated });
    });

    it('Should create a product with specified slug', async () => {
      const productData = randProduct();
      const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue(productData);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...dataToCreate } = productData;

      const product = await service.create(dataToCreate);

      expect(product).toEqual(productData);
      expect(saveSpy).toBeCalledWith(dataToCreate);
    });
  });

  describe('update', () => {
    it('Should return an updated product', async () => {
      const productData = randProduct();
      const findOneByIdSpy = jest
        .spyOn(service, 'findOneById')
        .mockResolvedValueOnce(productData);
      const dataToUpdate = {
        title: randText(),
        price: randNumber(),
      };
      const updatedSlug = randText();
      const updateSlugByTitleSpy = jest
        .spyOn(slugGeneratorService, 'updateSlugByTitle')
        .mockReturnValue(updatedSlug);
      const updatedProductData = {
        ...productData,
        ...dataToUpdate,
        slug: updatedSlug,
      };
      findOneByIdSpy.mockResolvedValueOnce(updatedProductData);
      const { id } = productData;
      const product = await service.update(id, dataToUpdate);
      expect(updateSlugByTitleSpy).toBeCalledWith(dataToUpdate, productData);
      expect(product).toEqual(updatedProductData);
      expect(findOneByIdSpy).toBeCalledTimes(2);
      expect(findOneByIdSpy).toBeCalledWith(id);
    });

    it('Should throw an error because product has been not found', async () => {
      jest.spyOn(service, 'findOneById').mockResolvedValue(null);
      await expect(() =>
        service.update(randUuid(), { title: randText() }),
      ).rejects.toThrow('Product with that id has not been found');
    });
  });

  describe('delete', () => {
    it('Should return true that product has been deleted', async () => {
      const id = randUuid();
      const deleteSpy = jest.spyOn(repo, 'delete');
      const isDeleted = await service.delete(id);
      expect(isDeleted).toEqual(true);
      expect(deleteSpy).toBeCalledWith({ id });
    });

    it('Should return false that product has not been deleted', async () => {
      const id = randUuid();
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
