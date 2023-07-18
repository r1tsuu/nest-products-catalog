import { Test } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { randOrder, randOrders } from '@/__test_utils__/order';
import { randUser } from '@/__test_utils__/user';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            findAll: jest.fn(),
            findAllByUser: jest.fn(),
            create: jest.fn(),
            cancel: jest.fn(),
            process: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(OrdersController);
    service = module.get(OrdersService);
  });

  describe('findAll', () => {
    it('Should return a list of orders', async () => {
      const ordersData = randOrders(13);
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(ordersData);
      const orders = await controller.findAll();

      expect(orders).toEqual(ordersData);
      expect(findAllSpy).toBeCalled();
    });
  });

  describe('findAllByUser', () => {
    it('Should return a list of orders for user', async () => {
      const user = randUser();
      const ordersData = randOrders(13);
      const findAllByUserSpy = jest
        .spyOn(service, 'findAllByUser')
        .mockResolvedValue(ordersData);
      const orders = await controller.findAllByUser(user);
      expect(orders).toEqual(ordersData);
      expect(findAllByUserSpy).toBeCalledWith(user);
    });
  });

  describe('create', () => {
    it('Should return a created order', async () => {
      const user = randUser();
      const orderData = { ...randOrder(), user: user };
      const productIds = orderData.products.map((product) => product.id);
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(orderData);
      const order = await controller.create({ productIds }, user);
      expect(order).toEqual(orderData);
      expect(createSpy).toBeCalledWith({ productIds }, user);
    });
  });

  describe('cancel', () => {
    it('Should return a canceled order', async () => {
      const user = randUser();
      const orderData = { ...randOrder(), isCanceled: true };
      const { id } = orderData;
      const cancelSpy = jest
        .spyOn(service, 'cancel')
        .mockResolvedValue(orderData);
      const order = await controller.cancel(id, user);
      expect(order).toEqual(orderData);
      expect(cancelSpy).toBeCalledWith(id, user);
    });
  });

  describe('process', () => {
    it('Should return a processed order', async () => {
      const orderData = { ...randOrder(), isProcessed: true };
      const { id } = orderData;
      const processSpy = jest
        .spyOn(service, 'process')
        .mockResolvedValue(orderData);
      const order = await controller.process(id);
      expect(order).toEqual(orderData);
      expect(processSpy).toBeCalledWith(id);
    });
  });
});
