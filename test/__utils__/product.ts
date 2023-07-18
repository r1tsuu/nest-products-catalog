import { randProduct } from '@/__test_utils__/products';

export const randProductToSave = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...product } = randProduct();
  return product;
};

export const randProductsToSave = (length = 2) =>
  Array.from({ length }, () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...product } = randProduct();
    return product;
  });
