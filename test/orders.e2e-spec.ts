import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { randUuid } from '@ngneat/falso';
import * as request from 'supertest';

import { Order } from '@/models/order.entity';
import { Product } from '@/models/product.entity';
import { User } from '@/models/user.entity';

import { AuthModule } from '@/auth/auth.module';
import { ProductsModule } from '@/products/products.module';
import { OrdersModule } from '@/orders/orders.module';
import { Role } from '@/models/role.enum';

import { dbModule } from './__utils__/db';
import { bootstrap } from './__utils__/bootstrap';
import { randProductsToSave } from './__utils__/product';
import { randUserToSave } from './__utils__/user';
import { mapOrders } from './__utils__/order';
import { Auth, getAuth } from './__utils__/auth';

describe('OrdersModule (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;
  let ordersRepo: Repository<Order>;
  let productsRepo: Repository<Product>;

  let admin: Auth;
  let user: Auth;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        dbModule('orders'),
        AuthModule,
        ProductsModule,
        OrdersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    usersRepo = moduleRef.get(getRepositoryToken(User));
    productsRepo = moduleRef.get(getRepositoryToken(Product));
    ordersRepo = moduleRef.get(getRepositoryToken(Order));

    await bootstrap(app);
  });

  beforeEach(async () => {
    await ordersRepo.delete({});
    await productsRepo.delete({});
    await usersRepo.delete({});

    admin = await getAuth(usersRepo, app, [Role.User, Role.Admin]);
    user = await getAuth(usersRepo, app, [Role.User]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be defined', () => {
    expect(app).toBeTruthy();
  });

  describe('GET /orders Admin Auth', () => {
    it('Should return all orders', async () => {
      const productsData = randProductsToSave(6);
      const usersData = [randUserToSave(), randUserToSave()];
      const users = await usersRepo.save(usersData);
      const products = await productsRepo.save(productsData);
      const ordersData = [
        {
          user: users[0],
          products: [products[4], products[2]],
        },
        {
          user: users[1],
          products: [products[3], products[2]],
        },
      ];
      const orders = await ordersRepo.save(ordersData);

      await request(app.getHttpServer())
        .get('/orders')
        .auth(...admin.auth)
        .expect(200)
        .expect((res) => expect(res.body).toEqual(mapOrders(orders)));

      // No auth provided
      await request(app.getHttpServer())
        .get('/orders')
        .expect(HttpStatus.UNAUTHORIZED);

      // Forbidden for user
      await request(app.getHttpServer())
        .get('/orders')
        .auth(...user.auth)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /orders/user', () => {
    it('Should get all orders for auth user', async () => {
      const productsData = randProductsToSave(8);
      const extraUser = await getAuth(usersRepo, app, [Role.User]);
      const products = await productsRepo.save(productsData);

      const ordersData = [
        {
          user: user.entity,
          products: [products[3], products[2], products[1]],
        },
        {
          user: extraUser.entity,
          products: [products[3], products[2], products[5], products[6]],
        },
        {
          user: user.entity,
          products: [products[1], products[3]],
        },
      ];

      const orders = await ordersRepo.save(ordersData);

      const req = async (user: Auth) => {
        request(app.getHttpServer())
          .get('/orders/user')
          .auth(...user.auth)
          .expect(200)
          .expect((res) =>
            expect(res.body).toEqual(
              mapOrders(orders).filter(
                (order) => order.user.id === user.entity.id,
              ),
            ),
          );
      };

      await req(user);
      await req(extraUser);
    });

    it('Should throw HTTP UNAUTHORIZED', async () => {
      await request(app.getHttpServer())
        .get('/orders/user')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /orders User Auth', () => {
    it('Should create an order', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);

      const productIds = products.map((prod) => prod.id);

      await request(app.getHttpServer())
        .post('/orders')
        .auth(...user.auth)
        .send({
          productIds,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.created_at).toBeTruthy();
          expect(res.body.isCanceled).toBe(false);
          expect(res.body.isProcessed).toBe(false);
          expect(res.body.id).toBeTruthy();
          expect(res.body.products.map((each: Product) => each.id)).toEqual(
            productIds,
          );
          expect(res.body.user.id).toBe(user.entity.id);
        });

      await request(app.getHttpServer())
        .post('/orders')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /orders/cancel/:id cancel an order', () => {
    it('Should cancel an order', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);

      const order = await ordersRepo.save({ user: user.entity, products });

      await request(app.getHttpServer())
        .put('/orders/cancel/' + order.id)
        .auth(...user.auth)
        .expect(200)
        .expect((res) => expect(res.body.isCanceled).toBe(true));
    });

    it('Should throw HTTP Bad Request because an order has already been canceled', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);

      const order = await ordersRepo.save({
        user: user.entity,
        products,
        isCanceled: true,
      });
      await request(app.getHttpServer())
        .put('/orders/cancel/' + order.id)
        .auth(...user.auth)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should throw HTTP Forbidden because trying to cancel a foreign order', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);

      const order = await ordersRepo.save({ user: user.entity, products });

      const newUser = await getAuth(usersRepo, app, [Role.User]);

      await request(app.getHttpServer())
        .put('/orders/cancel/' + order.id)
        .auth(...newUser.auth)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Should cancel a foreign order by admin', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);

      const order = await ordersRepo.save({ user: user.entity, products });

      await request(app.getHttpServer())
        .put('/orders/cancel/' + order.id)
        .auth(...admin.auth)
        .expect(200)
        .expect((res) => expect(res.body.isCanceled).toBe(true));
    });

    it('Should throw HTTP UNAUTHORIZED', async () => {
      await request(app.getHttpServer())
        .put('/orders/cancel/' + randUuid())
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /orders/process/:id', () => {
    it('Should process an order', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);

      const order = await ordersRepo.save({ user: user.entity, products });

      await request(app.getHttpServer())
        .put('/orders/process/' + order.id)
        .auth(...admin.auth)
        .expect(200)
        .expect((res) => expect(res.body.isProcessed).toBe(true));
    });

    it('Should throw Bad Request because an order has already been processed', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);
      const order = await ordersRepo.save({
        user: user.entity,
        products,
        isProcessed: true,
      });
      await request(app.getHttpServer())
        .put('/orders/process/' + order.id)
        .auth(...admin.auth)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should throw Bad Request because an order is canceled', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);
      const order = await ordersRepo.save({
        user: user.entity,
        products,
        isCanceled: true,
      });
      await request(app.getHttpServer())
        .put('/orders/process/' + order.id)
        .auth(...admin.auth)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('Should throw Forbidden as only admin can process orders', async () => {
      await request(app.getHttpServer())
        .put('/orders/process/' + randUuid())
        .auth(...user.auth)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Should throw HTTP UNAUTHORIZED', async () => {
      await request(app.getHttpServer())
        .put('/orders/process/' + randUuid())
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('Should delete and return object deleted: true', async () => {
      const productsData = randProductsToSave(4);
      const products = await productsRepo.save(productsData);
      const order = await ordersRepo.save({
        user: user.entity,
        products,
        isCanceled: true,
      });

      await request(app.getHttpServer())
        .delete('/orders/' + order.id)
        .auth(...admin.auth)
        .expect(HttpStatus.OK)
        .expect((res) => expect(res.body.deleted).toBe(true));
    });

    it('Should throw Forbidden as only admin can delete orders', async () => {
      await request(app.getHttpServer())
        .delete('/orders/' + randUuid())
        .auth(...user.auth)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('Should throw HTTP UNAUTHORIZED', async () => {
      await request(app.getHttpServer())
        .delete('/orders/' + randUuid())
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
