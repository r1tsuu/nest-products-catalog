import { Order } from '@/orders/order.entity';

export const mapOrders = (orders: Order[]) =>
  orders.map((date) => ({
    ...date,
    created_at: date.created_at.toJSON(),
    user: {
      ...date.user,
      password: undefined,
      orders: date.user.orders ?? [],
    },
  }));
