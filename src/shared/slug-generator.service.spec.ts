import { Test, TestingModule } from '@nestjs/testing';
import { SlugGeneratorService } from './slug-generator.service';
import * as slugify from 'slugify';

const mockSlugify = () =>
  jest
    .spyOn(slugify, 'default')
    .mockImplementation((string: string) => `${string}_slug`);

describe('SlugGeneratorService', () => {
  let service: SlugGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SlugGeneratorService],
    }).compile();

    service = module.get(SlugGeneratorService);
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('Should generate a slug from string', () => {
      const slugifySpy = mockSlugify();
      const slug = service.generate('some-string');
      expect(slug).toEqual('some-string_slug');
      expect(slugifySpy).toBeCalledWith('some-string');
    });
  });

  describe('updateSlugByTitle', () => {
    it('Should return updated slug because title has been provided and entity slug was generated', () => {
      const slugifySpy = mockSlugify();
      const updatedSlug = service.updateSlugByTitle(
        { title: 'new-product' },
        { title: 'product', slug: 'product_slug' },
      );
      expect(updatedSlug).toEqual('new-product_slug');
      expect(slugifySpy).toBeCalledTimes(2);
      expect(slugifySpy).toBeCalledWith('new-product');
      expect(slugifySpy).toBeCalledWith('product');
    });

    it('Should return entity slug because entity slug wasnt generated', () => {
      const slugifySpy = mockSlugify();
      const updatedSlug = service.updateSlugByTitle(
        { title: 'new-product' },
        { title: 'product', slug: 'slug_that_not_generated' },
      );
      expect(updatedSlug).toEqual('slug_that_not_generated');
      expect(slugifySpy).toBeCalledTimes(1);
      expect(slugifySpy).toBeCalledWith('product');
    });

    it('Should return provided slug', () => {
      const slugifySpy = mockSlugify();
      const updatedSlug = service.updateSlugByTitle(
        { title: 'new-product', slug: 'provided_slug' },
        { title: 'product', slug: 'product_slug' },
      );
      expect(updatedSlug).toEqual('provided_slug');
      expect(slugifySpy).not.toBeCalled();
    });

    it('Should return entity slug because title has not been provided', () => {
      const slugifySpy = mockSlugify();
      const updatedSlug = service.updateSlugByTitle(
        {},
        { title: 'product', slug: 'product_slug' },
      );

      expect(updatedSlug).toEqual('product_slug');
      expect(slugifySpy).not.toBeCalled();
    });
  });
});
