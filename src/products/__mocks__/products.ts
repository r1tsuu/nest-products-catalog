import { Product } from '../product.entity';

export const mockProducts: Product[] = [
  {
    id: 'uuid-1',
    title: 'Iphone 1',
    price: 1000,
    photo: 'https://some.com/iphone.png',
    slug: 'iphone-1',
  },
  {
    id: 'uuid-2',
    title: 'Samsung 1',
    price: 800,
    photo: 'https://some.com/samsung.png',
    slug: 'samsung-1',
  },
];

export const mockProduct = { ...mockProducts[0] };

export const createMockProductById = (id: string) => ({ ...mockProduct, id });

export const createMockProductBySlug = (slug: string) => ({
  ...mockProduct,
  slug,
});

export const createMockProductsByTitle = (title: string) =>
  mockProducts.map((product) => ({ ...product, title }));
