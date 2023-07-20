import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randUuid } from '@ngneat/falso';

import { Role } from '@/users/interfaces/role.enum';
import { ProductsService } from '@/products/products.service';
import { randOrder, randOrders } from '@/__test_utils__/order';
import { randUser } from '@/__test_utils__/user';

import { OrdersService } from './orders.service';
import { Order } from './order.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let productsService: ProductsService;
  let repo: Repository<Order>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            create: jest.fn().mockImplementation((value: any) => value),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    productsService = module.get(ProductsService);
    repo = module.get(getRepositoryToken(Order));
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('Should create an order', async () => {
      const order = randOrder();

      const { products, user } = order;
      const findByIdsSpy = jest
        .spyOn(productsService, 'findByIds')
        .mockResolvedValue(products);
      const createSpy = jest.spyOn(repo, 'create');

      const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue(order);

      const productIds = products.map((each) => each.id);
      const product = await service.create({ productIds }, user);

      expect(product).toEqual(order);
      expect(findByIdsSpy).toBeCalledWith(productIds);
      expect(createSpy).toBeCalledWith({ user, products });
      expect(saveSpy).toBeCalledWith({ user, products });
    });

    it('Should fail because products with provided ids have not been found', async () => {
      const findByIdsSpy = jest
        .spyOn(productsService, 'findByIds')
        .mockResolvedValue([]);

      const productIds = Array.from({ length: 5 }, () => randUuid());

      await expect(() =>
        service.create({ productIds }, randUser()),
      ).rejects.toThrow('Products with provided ids have not been found');

      expect(findByIdsSpy).toBeCalledWith(productIds);
    });
  });

  describe('findAll', () => {
    it('Should return a list of orders', async () => {
      const ordersData = randOrders();
      const findSpy = jest.spyOn(repo, 'find').mockResolvedValue(ordersData);

      const orders = await service.findAll();

      expect(orders).toEqual(ordersData);
      expect(findSpy).toBeCalledWith({
        relations: { user: true, products: true },
      });
    });
  });

  describe('findAllByUser', () => {
    it('Should return a list of orders by user', async () => {
      const ordersData = randOrders();
      const user = randUser();
      const findSpy = jest.spyOn(repo, 'find').mockResolvedValue(ordersData);

      const orders = await service.findAllByUser(user);
      expect(orders).toEqual(ordersData);
      expect(findSpy).toBeCalledWith({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: { user: true, products: true },
      });
    });
  });

  describe('findById', () => {
    it('Should return an order', async () => {
      const orderData = randOrder();
      const findOneSpy = jest
        .spyOn(repo, 'findOne')
        .mockResolvedValue(orderData);

      const order = await service.findById(orderData.id);

      expect(order).toEqual(orderData);
      expect(findOneSpy).toBeCalledWith({
        where: { id: orderData.id },
        relations: { user: true, products: true },
      });
    });
  });

  describe('findByIdOrFail', () => {
    it('Should return an order', async () => {
      const orderData = randOrder();
      const { id } = orderData;
      const findByIdSpy = jest
        .spyOn(service, 'findById')
        .mockResolvedValue(orderData);

      const order = await service.findByIdOrFail(id);

      expect(order).toEqual(orderData);
      expect(findByIdSpy).toBeCalledWith(id);
    });

    it('Should fail because order has not been found', async () => {
      const findByIdSpy = jest
        .spyOn(service, 'findById')
        .mockResolvedValue(null);
      const id = randUuid();

      await expect(() => service.findByIdOrFail(id)).rejects.toThrow(
        'Order with provided id has not been found',
      );

      expect(findByIdSpy).toBeCalledWith(id);
    });
  });

  describe('cancel', () => {
    it('Should return a canceled order', async () => {
      const orderData = randOrder();
      const canceledOrder = { ...orderData, isCanceled: true };
      const { id } = orderData;
      const findByIdOrFailSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(orderData);
      const findByIdSpy = jest
        .spyOn(service, 'findById')
        .mockResolvedValueOnce(canceledOrder);
      const updateSpy = jest.spyOn(repo, 'update');

      const order = await service.cancel(id);

      expect(order).toEqual(canceledOrder);
      expect(findByIdOrFailSpy).toBeCalledWith(id);
      expect(updateSpy).toBeCalledWith({ id }, { isCanceled: true });
      expect(findByIdSpy).toBeCalledWith(id);
    });

    it('Should throw an error because user can only cancel his orders', async () => {
      const user = randUser();
      const orderData = randOrder();
      const { id } = orderData;
      const findByIdOrFailSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(orderData);

      await expect(() => service.cancel(id, user)).rejects.toThrow('Forbidden');

      expect(findByIdOrFailSpy).toBeCalledWith(id);
    });

    it('Should return a canceled order because admin can cancel any orders', async () => {
      const userData = { ...randUser(), roles: [Role.Admin] };
      const orderData = randOrder();
      const canceledOrder = { ...orderData, isCanceled: true };
      const { id } = orderData;
      const findByIdOrFailSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(orderData);
      const findByIdSpy = jest
        .spyOn(service, 'findById')
        .mockResolvedValueOnce(canceledOrder);
      const updateSpy = jest.spyOn(repo, 'update');

      const order = await service.cancel(id, userData);

      expect(order).toEqual(canceledOrder);
      expect(findByIdOrFailSpy).toBeCalledWith(id);
      expect(updateSpy).toBeCalledWith({ id }, { isCanceled: true });
      expect(findByIdSpy).toBeCalledWith(id);
    });
  });

  describe('process', () => {
    it('Should return a processed order', async () => {
      const orderData = randOrder();
      const processedOrder = { ...orderData, isProcessed: true };
      const { id } = orderData;
      const findByIdOrFailSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(orderData);
      const findByIdSpy = jest
        .spyOn(service, 'findById')
        .mockResolvedValueOnce(processedOrder);
      const updateSpy = jest.spyOn(repo, 'update');

      const order = await service.process(id);

      expect(order).toEqual(processedOrder);
      expect(findByIdOrFailSpy).toBeCalledWith(id);
      expect(updateSpy).toBeCalledWith({ id }, { isProcessed: true });
      expect(findByIdSpy).toBeCalledWith(id);
    });

    it('Should fail because order with provided id has not been found', async () => {
      const id = randUuid();
      const findByIdSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockRejectedValue(new Error());
      await expect(() => service.process(id)).rejects.toThrow();
      expect(findByIdSpy).toBeCalledTimes(1);
      expect(findByIdSpy).toBeCalledWith(id);
    });

    it('Should fail because order is already processed', async () => {
      const order = { ...randOrder(), isProcessed: true };
      const { id } = order;
      const findByIdSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(order);

      await expect(() => service.process(id)).rejects.toThrow(
        'Order is already processed',
      );

      expect(findByIdSpy).toBeCalledTimes(1);
      expect(findByIdSpy).toBeCalledWith(id);
    });

    it('Should fail because order is canceled', async () => {
      const order = { ...randOrder(), isCanceled: true };
      const { id } = order;
      const findByIdSpy = jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(order);

      await expect(() => service.process(id)).rejects.toThrow(
        'Order is canceled',
      );

      expect(findByIdSpy).toBeCalledTimes(1);
      expect(findByIdSpy).toBeCalledWith(id);
    });
  });

  describe('delete', () => {
    it('Should delete an order and return true', async () => {
      const id = randUuid();
      const deleteSpy = jest.spyOn(repo, 'delete');

      const isDeleted = await service.delete(id);

      expect(isDeleted).toEqual(true);
      expect(deleteSpy).toBeCalledWith({ id });
    });

    it('Should return false because of db error', async () => {
      const id = randUuid();
      const deleteSpy = jest
        .spyOn(repo, 'delete')
        .mockRejectedValue(new Error());

      const isDeleted = await service.delete(id);

      expect(isDeleted).toEqual(false);
      expect(deleteSpy).toBeCalledWith({ id });
    });
  });
});
