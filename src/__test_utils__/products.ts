import { Product } from '@/products/product.entity';
import { randNumber, randTextRange, randUrl, randUuid } from '@ngneat/falso';

export const randProduct = (): Product => ({
  id: randUuid(),
  title: randTextRange({ min: 5, max: 30 }),
  price: randNumber({ min: 100, max: 1000 }),
  photo: randUrl(),
  slug: randTextRange({ min: 8, max: 40 }),
});

export const randProducts = (length = 2) =>
  Array.from({ length }, () => randProduct());
