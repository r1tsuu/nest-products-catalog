import { Order } from '@/orders/order.entity';
import { randProduct } from './products';
import { randUser } from './user';
import { randPastDate, randUuid } from '@ngneat/falso';

export const randOrder = (): Order => ({
  id: randUuid(),
  user: randUser(),
  products: Array.from({ length: 5 }, randProduct),
  created_at: randPastDate(),
  isProcessed: false,
  isCanceled: false,
});

export const randOrders = (length = 3) =>
  Array.from({ length }, () => randOrder());
